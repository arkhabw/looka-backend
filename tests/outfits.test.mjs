import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  console.log('[TEST] Starting Day 6 Outfits CRUD & Calendar Tracker Tests...');
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
  const userEmail = `outfit_tester_${Date.now()}@looka.id`;
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userEmail,
      username: 'OutfitTester',
      password: 'Password123!',
      city: 'Jakarta',
    }),
  });
  const regData = await registerRes.json();
  const token = regData.data?.token;
  assert(regData.success === true && !!token, 'Register test user and acquire token');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Upload Sample Clothes
  const dummyImgPath = path.resolve('temp_outfit_test.png');
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
    formData.append('occasion', item.occasion || 'Casual Hangout');

    const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/png' });
    formData.append('image', fileBlob, 'sample.png');

    const res = await fetch(`${BASE_URL}/clothes`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    return await res.json();
  };

  const top = await uploadItem({ name: 'Kaos Hitam Oversized', category: 'Tops', color: 'Hitam' });
  const bottom = await uploadItem({ name: 'Celana Cargo Krem', category: 'Bottoms', color: 'Krem' });
  const shoes = await uploadItem({ name: 'Sneakers Putih', category: 'Footwear', color: 'Putih' });

  assert(
    top.success && bottom.success && shoes.success,
    'Upload sample wardrobe items (Top, Bottom, Footwear)'
  );

  const topId = top.data.id;
  const bottomId = bottom.data.id;
  const shoesId = shoes.data.id;

  // Verify initial lastWornAt is null
  assert(top.data.lastWornAt === null, 'Clothing item initial lastWornAt is null');

  // 4. Create Outfit (POST /api/outfits)
  const createOutfitRes = await fetch(`${BASE_URL}/outfits`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Weekend Streetwear',
      topId,
      bottomId,
      footwearId: shoesId,
      occasion: 'Casual Hangout',
      isFavorite: true,
    }),
  });
  const createOutfitData = await createOutfitRes.json();
  assert(createOutfitRes.status === 201, 'Create outfit returns HTTP 201');
  assert(createOutfitData.success === true, 'Create outfit response success');
  assert(createOutfitData.data.name === 'Weekend Streetwear', 'Created outfit name matches');
  assert(createOutfitData.data.isFavorite === true, 'Created outfit favorite status is true');
  assert(!!createOutfitData.data.top && createOutfitData.data.top.id === topId, 'Created outfit has top relation populated');

  const outfitId = createOutfitData.data.id;

  // 5. Get Outfits List (GET /api/outfits)
  const listRes = await fetch(`${BASE_URL}/outfits`, { headers: authHeaders });
  const listData = await listRes.json();
  assert(listRes.status === 200, 'Get outfits list returns HTTP 200');
  assert(listData.data.length === 1, 'Outfits list contains 1 outfit');
  assert(listData.data[0].id === outfitId, 'Outfit ID matches in list');

  // 6. Filter Favorites (GET /api/outfits?isFavorite=true)
  const favRes = await fetch(`${BASE_URL}/outfits?isFavorite=true`, { headers: authHeaders });
  const favData = await favRes.json();
  assert(favRes.status === 200, 'Filter favorite outfits returns HTTP 200');
  assert(favData.data.length === 1 && favData.data[0].isFavorite === true, 'Favorite filter returns favorite outfit');

  // 7. Get Outfit Details (GET /api/outfits/:id)
  const detailRes = await fetch(`${BASE_URL}/outfits/${outfitId}`, { headers: authHeaders });
  const detailData = await detailRes.json();
  assert(detailRes.status === 200, 'Get single outfit by ID returns HTTP 200');
  assert(detailData.data.id === outfitId, 'Single outfit ID matches');
  assert(detailData.data.bottom.name === 'Celana Cargo Krem', 'Bottom relation properly populated');

  // 8. Update Outfit (PUT /api/outfits/:id)
  const updateRes = await fetch(`${BASE_URL}/outfits/${outfitId}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Signature Streetwear',
      isFavorite: false,
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.status === 200, 'Update outfit returns HTTP 200');
  assert(updateData.data.name === 'Signature Streetwear', 'Updated outfit name matches');
  assert(updateData.data.isFavorite === false, 'Updated isFavorite toggle matches');

  // 9. Log Outfit Wear Today (POST /api/outfits/wear-today)
  const wearDate = '2026-09-16';
  const wearRes = await fetch(`${BASE_URL}/outfits/wear-today`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outfitId,
      wornDate: wearDate,
      notes: 'Dipakai jalan sore di Senopati, nyaman dan stylish.',
    }),
  });
  const wearData = await wearRes.json();
  assert(wearRes.status === 201, 'Log wear-today returns HTTP 201');
  assert(wearData.success === true, 'Log wear-today response is success');
  assert(wearData.data.updatedItemsCount === 3, 'All 3 clothing items marked for update');

  const logId = wearData.data.log.id;

  // 10. CRITICAL CHECK: Verify lastWornAt was updated on clothes table!
  const checkTopRes = await fetch(`${BASE_URL}/clothes/${topId}`, { headers: authHeaders });
  const checkTopData = await checkTopRes.json();
  assert(
    checkTopData.data.lastWornAt !== null,
    'Clothing item lastWornAt timestamp was automatically updated in database!'
  );

  // 11. Get Wear Calendar (GET /api/outfits/calendar)
  const calRes = await fetch(`${BASE_URL}/outfits/calendar`, { headers: authHeaders });
  const calData = await calRes.json();
  assert(calRes.status === 200, 'Get calendar history returns HTTP 200');
  assert(calData.data.length === 1, 'Calendar contains 1 log entry');
  assert(calData.data[0].id === logId, 'Calendar log ID matches');
  assert(calData.data[0].wornDate === wearDate, 'Calendar wornDate matches');
  assert(!!calData.data[0].outfit.top, 'Calendar entry includes populated outfit relations');

  // 12. Filter Calendar by Month (GET /api/outfits/calendar?month=2026-09)
  const calMonthRes = await fetch(`${BASE_URL}/outfits/calendar?month=2026-09`, { headers: authHeaders });
  const calMonthData = await calMonthRes.json();
  assert(calMonthRes.status === 200, 'Filter calendar by month returns HTTP 200');
  assert(calMonthData.data.length === 1, 'Monthly calendar filter matches expected log');

  // 13. Delete Calendar Log (DELETE /api/outfits/calendar/:logId)
  const delLogRes = await fetch(`${BASE_URL}/outfits/calendar/${logId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delLogData = await delLogRes.json();
  assert(delLogRes.status === 200, 'Delete calendar log returns HTTP 200');
  assert(delLogData.success === true, 'Delete calendar log response is success');

  // 14. Delete Outfit (DELETE /api/outfits/:id)
  const delOutfitRes = await fetch(`${BASE_URL}/outfits/${outfitId}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  const delOutfitData = await delOutfitRes.json();
  assert(delOutfitRes.status === 200, 'Delete outfit returns HTTP 200');
  assert(delOutfitData.success === true, 'Delete outfit response is success');

  const checkDeletedRes = await fetch(`${BASE_URL}/outfits/${outfitId}`, { headers: authHeaders });
  assert(checkDeletedRes.status === 404, 'Deleted outfit returns HTTP 404 on subsequent get');

  // 15. Cross-User Security Isolation Check
  const userBEmail = `user_b_${Date.now()}@looka.id`;
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      username: 'UserB',
      password: 'Password123!',
    }),
  });
  const regBData = await regBRes.json();
  const tokenB = regBData.data.token;

  // User B tries to create an outfit using User A's clothing item
  const crossUserRes = await fetch(`${BASE_URL}/outfits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hacked Outfit',
      topId, // User A's top
    }),
  });
  assert(crossUserRes.status === 400, 'Cross-user clothing hijacking blocked with HTTP 400');

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
  console.error('[ERROR] Outfits test runner exception:', err);
  process.exit(1);
});
