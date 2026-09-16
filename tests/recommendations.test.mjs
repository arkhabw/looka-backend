import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

const runTests = async () => {
  console.log('[TEST] Starting Day 5 Recommendation Engine & AI Stylist Tests...');
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

  // 1. Check Server Health
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.success === true, 'Server health check returns success');
  } catch (err) {
    console.error('[FATAL] Server is not running on port 5001. Please start server first.', err.message);
    process.exit(1);
  }

  // 2. Register & Login Test User for Day 5
  const testEmail = `day5_${Date.now()}@looka.id`;
  const testPassword = 'Password123!';

  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      username: 'Day5Tester',
      password: testPassword,
      stylePreference: 'Casual',
      city: 'Jakarta',
    }),
  });
  const regData = await registerRes.json();
  const token = regData.data?.token;
  assert(regData.success === true && !!token, 'Register and acquire auth token');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Helper to create a dummy image and upload clothing item
  const dummyImgPath = path.resolve('temp_test_img.png');
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
    formData.append('weather', item.weather || 'All Weather');

    const fileBlob = new Blob([fs.readFileSync(dummyImgPath)], { type: 'image/png' });
    formData.append('image', fileBlob, 'sample.png');

    const res = await fetch(`${BASE_URL}/clothes`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });
    return await res.json();
  };

  // Upload wardrobe
  const item1 = await uploadItem({
    name: 'Kaos Putih Polos',
    category: 'Tops',
    color: 'Putih',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
  });

  const item2 = await uploadItem({
    name: 'Celana Chino Cokelat',
    category: 'Bottoms',
    color: 'Cokelat',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
  });

  const item3 = await uploadItem({
    name: 'Jaket Denim Biru',
    category: 'Outerwear',
    color: 'Biru',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'Cold',
  });

  const item4 = await uploadItem({
    name: 'Sneakers Putih',
    category: 'Footwear',
    color: 'Putih',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
  });

  const item5 = await uploadItem({
    name: 'Kemeja Formal Navy',
    category: 'Tops',
    color: 'Navy',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
  });

  const item6 = await uploadItem({
    name: 'Celana Bahan Hitam',
    category: 'Bottoms',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
  });

  assert(
    item1.success === true && item2.success === true && item3.success === true,
    'Upload diverse wardrobe items (Tops, Bottoms, Outerwear, Footwear)'
  );

  // 4. Test GET /api/recommendations (Default parameters)
  const getRecRes = await fetch(`${BASE_URL}/recommendations`, {
    headers: authHeaders,
  });
  const getRecData = await getRecRes.json();

  assert(getRecRes.status === 200, 'GET /api/recommendations returns HTTP 200');
  assert(getRecData.success === true, 'GET /api/recommendations response is success');
  assert(!!getRecData.data.weather, 'Weather info included in recommendations response');
  assert(Array.isArray(getRecData.data.recommendations) && getRecData.data.recommendations.length > 0, 'Recommendations array returned with combinations');
  assert(!!getRecData.data.stylistAdvice, 'AI/Rule-based Stylist Advice included');
  assert(!!getRecData.data.stylistSource, 'Stylist source identified (gemini_ai or rule_based_engine)');
  console.log(`[INFO] Stylist Engine Active Source: ${getRecData.data.stylistSource}`);
  console.log(`[INFO] Stylist Review: "${getRecData.data.stylistAdvice}"`);
  console.log(`[INFO] Weather Data Source: ${getRecData.data.weather.source} (${getRecData.data.weather.city}, ${getRecData.data.weather.temperature}°C, ${getRecData.data.weather.description})`);

  // 5. Test POST /api/recommendations with specific occasion (Work) and city (Bandung)
  const postRecRes = await fetch(`${BASE_URL}/recommendations`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      occasion: 'Work',
      city: 'Bandung',
    }),
  });
  const postRecData = await postRecRes.json();

  assert(postRecRes.status === 200, 'POST /api/recommendations with occasion=Work returns HTTP 200');
  assert(postRecData.data.city === 'Bandung', 'Target city Bandung respected');
  const topRec = postRecData.data.recommendations[0];
  assert(topRec.score >= 70, `Top recommendation score is high (${topRec.score}/100)`);
  assert(
    topRec.top.name.includes('Navy') || topRec.top.style === 'Formal',
    'Formal/Navy work shirt prioritized for Work occasion'
  );

  // 6. Test Locked Item Feature (Pin Jaket Denim Biru)
  const lockedOuterId = item3.data.id;
  const lockedRecRes = await fetch(`${BASE_URL}/recommendations`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lockedItemId: lockedOuterId,
    }),
  });
  const lockedRecData = await lockedRecRes.json();

  assert(lockedRecRes.status === 200, 'POST /api/recommendations with lockedItemId returns HTTP 200');
  const allIncludeLocked = lockedRecData.data.recommendations.every(
    (rec) => rec.outer && rec.outer.id === lockedOuterId
  );
  assert(allIncludeLocked, 'All returned outfit recommendations include the locked item (Jaket Denim)');

  // 7. Test Error Handling: Invalid lockedItemId
  const invalidLockRes = await fetch(`${BASE_URL}/recommendations`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lockedItemId: 999999,
    }),
  });
  const invalidLockData = await invalidLockRes.json();
  assert(invalidLockRes.status === 404, 'Invalid lockedItemId returns HTTP 404');
  assert(invalidLockData.success === false, 'Invalid lockedItemId error response structure');

  // 8. Test Error Handling: Incomplete Wardrobe (User with 0 clothes)
  const emptyUserRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `empty_${Date.now()}@looka.id`,
      username: 'EmptyWardrobeUser',
      password: testPassword,
    }),
  });
  const emptyUserData = await emptyUserRes.json();
  const emptyToken = emptyUserData.data.token;

  const emptyRecRes = await fetch(`${BASE_URL}/recommendations`, {
    headers: { Authorization: `Bearer ${emptyToken}` },
  });
  const emptyRecData = await emptyRecRes.json();
  assert(emptyRecRes.status === 400, 'User with empty wardrobe receives HTTP 400');
  assert(
    emptyRecData.message.includes('lemari') || emptyRecData.message.includes('kosong'),
    'Incomplete wardrobe returns clear instructive message'
  );

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
  console.error('[ERROR] Unexpected test runner exception:', err);
  process.exit(1);
});
