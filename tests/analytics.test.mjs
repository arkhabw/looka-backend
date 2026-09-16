import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  console.log('[TEST] Starting Day 7 Wardrobe Analytics Tests...');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, detail = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  };

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert(healthData.success === true, 'Server health check returns success');

  // 2. Register Test User
  const userEmail = `analytics_tester_${Date.now()}@looka.id`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userEmail,
      username: 'AnalyticsTester',
      password: 'Password123!',
      city: 'Jakarta',
    }),
  });
  const regData = await regRes.json();
  const token = regData.data?.token;
  assert(regData.success === true && !!token, 'Register test user for analytics');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Test Analytics on Empty Wardrobe (Verify zero-division safety)
  const emptyAnalyticsRes = await fetch(`${BASE_URL}/users/analytics`, { headers: authHeaders });
  const emptyAnalyticsData = await emptyAnalyticsRes.json();

  assert(emptyAnalyticsRes.status === 200, 'GET /api/users/analytics on empty wardrobe returns HTTP 200');
  assert(emptyAnalyticsData.success === true, 'Analytics response status is success');
  assert(emptyAnalyticsData.data.overview.totalClothes === 0, 'Initial totalClothes is 0');
  assert(emptyAnalyticsData.data.overview.utilizationRate === 0, 'Initial utilizationRate is 0%');
  assert(emptyAnalyticsData.data.categoryBreakdown.length === 0, 'Initial categoryBreakdown is empty');
  assert(!!emptyAnalyticsData.data.sustainabilityInsight, 'Sustainability advice provided for empty wardrobe');

  // 4. Upload Sample Clothes
  const dummyImgPath = path.resolve('temp_analytics_test.png');
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(dummyImgPath, png1x1);

  const uploadItem = async (item) => {
    const formData = new FormData();
    formData.append('name', item.name);
    formData.append('category', item.category);
    formData.append('color', item.color);
    formData.append('style', item.style || 'Casual');

    const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/png' });
    formData.append('image', fileBlob, 'sample.png');

    const res = await fetch(`${BASE_URL}/clothes`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    return await res.json();
  };

  const item1 = await uploadItem({ name: 'Kaos Putih Katun', category: 'Tops', color: 'Putih' });
  const item2 = await uploadItem({ name: 'Kemeja Navy Oxford', category: 'Tops', color: 'Navy' });
  const item3 = await uploadItem({ name: 'Celana Hitam Chino', category: 'Bottoms', color: 'Hitam' });
  const item4 = await uploadItem({ name: 'Sneakers Putih Low', category: 'Footwear', color: 'Putih' });

  assert(
    item1.success && item2.success && item3.success && item4.success,
    'Upload 4 diverse clothes items'
  );

  // 5. Test Analytics with Unworn Clothes
  const populatedRes = await fetch(`${BASE_URL}/users/analytics`, { headers: authHeaders });
  const populatedData = await populatedRes.json();

  assert(populatedData.data.overview.totalClothes === 4, 'totalClothes is exactly 4');
  assert(populatedData.data.overview.wornClothesCount === 0, 'wornClothesCount is 0 before any logs');
  assert(populatedData.data.overview.unwornClothesCount === 4, 'unwornClothesCount is 4');
  assert(populatedData.data.overview.utilizationRate === 0, 'utilizationRate is 0% when no clothes have been worn');

  // Verify category distribution
  const topsCategory = populatedData.data.categoryBreakdown.find((c) => c.category === 'Tops');
  assert(topsCategory && topsCategory.count === 2, 'Category distribution counts 2 Tops');

  // Verify color distribution
  const whiteColor = populatedData.data.colorBreakdown.find((c) => c.color === 'Putih');
  assert(whiteColor && whiteColor.count === 2 && whiteColor.percentage === 50, 'Dominant color Putih is 50%');

  // 6. Log a Wear Event (Wear Today)
  const wearRes = await fetch(`${BASE_URL}/outfits/wear-today`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topId: item1.data.id,
      bottomId: item3.data.id,
      wornDate: '2026-09-16',
      notes: 'OOTD meeting dan kerja.',
    }),
  });
  const wearData = await wearRes.json();
  assert(wearRes.status === 201 && wearData.success === true, 'Wear log recorded');

  // 7. Test Analytics after Wear Event (Verification of Utilization Jump)
  const activeRes = await fetch(`${BASE_URL}/users/analytics`, { headers: authHeaders });
  const activeData = await activeRes.json();

  assert(activeData.data.overview.totalWornLogs === 1, 'totalWornLogs updated to 1');
  assert(activeData.data.overview.wornClothesCount === 2, 'wornClothesCount increased to 2');
  assert(activeData.data.overview.unwornClothesCount === 2, 'unwornClothesCount decreased to 2');
  assert(activeData.data.overview.utilizationRate === 50, 'utilizationRate computed correctly as 50%');

  // Verify most worn items
  assert(activeData.data.mostWornItems.length === 2, 'mostWornItems includes exactly the 2 worn clothes');
  assert(activeData.data.mostWornItems[0].wearCount === 1, 'Top item has wearCount = 1');

  // Verify neglected items
  assert(activeData.data.neglectedItems.length === 2, 'neglectedItems includes the 2 unworn clothes');
  const neglectedNames = activeData.data.neglectedItems.map((c) => c.name);
  assert(
    neglectedNames.includes('Kemeja Navy Oxford') && neglectedNames.includes('Sneakers Putih Low'),
    'Unworn items correctly identified in neglectedItems list'
  );

  // 8. Cross-User Security Check
  const userBEmail = `user_analytics_b_${Date.now()}@looka.id`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      username: 'UserBAnalytics',
      password: 'Password123!',
    }),
  });
  const regBData = await regBRes.json();
  const tokenB = regBData.data.token;

  const userBAnalyticsRes = await fetch(`${BASE_URL}/users/analytics`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const userBAnalyticsData = await userBAnalyticsRes.json();
  assert(userBAnalyticsData.data.overview.totalClothes === 0, 'User B analytics isolated (totalClothes is 0)');

  // Clean up temp image
  if (fs.existsSync(dummyImgPath)) {
    fs.unlinkSync(dummyImgPath);
  }

  console.log('----------------------------------------------------');
  console.log(`[TEST SUMMARY] Total Passed: ${passed} | Total Failed: ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
};

runTests().catch((err) => {
  console.error('[ERROR] Analytics test runner exception:', err);
  process.exit(1);
});
