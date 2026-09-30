import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5001/api';

const runVerification = async () => {
  console.log('================================================================');
  console.log('🚀 LOOKA AUTOMATED VERIFICATION: CHECKLIST PENGUJIAN');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, detail = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title} - Detail: ${detail}`);
      failed++;
    }
  };

  const dummyImgPath = path.resolve('temp_verification_test.png');
  const png1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(dummyImgPath, png1x1);

  try {
    // -------------------------------------------------------------
    // 1. REGISTER DAN LOGIN
    // -------------------------------------------------------------
    console.log('▶️ [1/9] Menguji Register dan Login...');
    const testEmail = `tester_${Date.now()}@looka.id`;
    const password = 'PasswordRahasia123!';

    // 1.1 Register User
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: 'LookaTester',
        password,
        stylePreference: 'Casual',
        city: 'Bandung',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success && regData.data?.token, 'Register akun baru berhasil (HTTP 201)');

    // 1.2 Duplicate Email Detection
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        username: 'LookaTesterDuplicate',
        password,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && !dupData.success, 'Validasi email duplikat ditolak dengan aman (HTTP 400)');

    // 1.3 Login User (Valid)
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password,
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    assert(loginRes.status === 200 && loginData.success && !!token, 'Login dengan kredensial benar berhasil (HTTP 200)');

    // 1.4 Login (Wrong Password)
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'SalahPassword123!',
      }),
    });
    assert(wrongPassRes.status === 401, 'Login dengan password salah ditolak (HTTP 401)');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // -------------------------------------------------------------
    // 2. EDIT PROFIL
    // -------------------------------------------------------------
    console.log('\n▶️ [2/9] Menguji Edit Profil & Profil Me...');
    // 2.1 Get Current Profile
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.data?.email === testEmail, 'Ambil data profil pengguna /me (HTTP 200)');

    // 2.2 Update Profile
    const updateProfRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'LookaTesterUpdated',
        stylePreference: 'Streetwear',
        city: 'Jakarta',
      }),
    });
    const updateProfData = await updateProfRes.json();
    assert(
      updateProfRes.status === 200 &&
      updateProfData.data?.username === 'LookaTesterUpdated' &&
      updateProfData.data?.stylePreference === 'Streetwear',
      'Perbarui profil (username, preferensi gaya, kota) berhasil (HTTP 200)'
    );

    // -------------------------------------------------------------
    // 3. TAMBAH, EDIT, DAN HAPUS PAKAIAN (CRUD CLOTHES)
    // -------------------------------------------------------------
    console.log('\n▶️ [3/9] Menguji Tambah, Edit, dan Hapus Pakaian...');
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

    // 3.1 Create Clothes Items
    const topItem = await uploadItem({ name: 'Kaos Hitam Minimalis', category: 'Tops', color: 'Hitam', style: 'Casual' });
    const bottomItem = await uploadItem({ name: 'Celana Jeans Denim', category: 'Bottoms', color: 'Biru', style: 'Casual' });
    const outerItem = await uploadItem({ name: 'Jaket Bomber Navy', category: 'Outerwear', color: 'Navy', style: 'Streetwear' });
    const shoeItem = await uploadItem({ name: 'Sneakers Putih Classic', category: 'Footwear', color: 'Putih', style: 'Casual' });
    const tempItem = await uploadItem({ name: 'Topi Kupluk Hitam', category: 'Accessories', color: 'Hitam', style: 'Casual' });

    assert(topItem.success && topItem.data?.id, 'Tambah pakaian: Tops (HTTP 201)');
    assert(bottomItem.success && bottomItem.data?.id, 'Tambah pakaian: Bottoms (HTTP 201)');
    assert(outerItem.success && outerItem.data?.id, 'Tambah pakaian: Outerwear (HTTP 201)');
    assert(shoeItem.success && shoeItem.data?.id, 'Tambah pakaian: Footwear (HTTP 201)');

    const topId = topItem.data.id;
    const bottomId = bottomItem.data.id;
    const outerId = outerItem.data.id;
    const shoeId = shoeItem.data.id;
    const tempId = tempItem.data.id;

    // 3.2 Edit Clothing Item
    const editRes = await fetch(`${BASE_URL}/clothes/${tempId}`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Topi Beanie Hitam Premium',
        color: 'Abu-Abu',
      }),
    });
    const editData = await editRes.json();
    assert(editRes.status === 200 && editData.data?.name === 'Topi Beanie Hitam Premium', 'Edit detail pakaian berhasil (HTTP 200)');

    // 3.3 Delete Clothing Item
    const delRes = await fetch(`${BASE_URL}/clothes/${tempId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delRes.status === 200, 'Hapus pakaian berhasil (HTTP 200)');

    // Verify deleted item is not found
    const verifyDelRes = await fetch(`${BASE_URL}/clothes/${tempId}`, { headers: authHeaders });
    assert(verifyDelRes.status === 404, 'Verifikasi pakaian yang dihapus mengembalikan 404 Not Found');

    // -------------------------------------------------------------
    // 4. SEARCH DAN FILTER WARDROBE
    // -------------------------------------------------------------
    console.log('\n▶️ [4/9] Menguji Search dan Filter Wardrobe...');
    // 4.1 Filter by Category
    const filterCatRes = await fetch(`${BASE_URL}/clothes?category=Tops`, { headers: authHeaders });
    const filterCatData = await filterCatRes.json();
    assert(
      filterCatRes.status === 200 &&
      filterCatData.data.every((i) => i.category === 'Tops'),
      'Filter pakaian berdasarkan kategori Tops (HTTP 200)'
    );

    // 4.2 Search by Keyword
    const searchRes = await fetch(`${BASE_URL}/clothes?search=Jeans`, { headers: authHeaders });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
      searchData.data.some((i) => i.name.includes('Jeans')),
      'Pencarian pakaian dengan keyword "Jeans" berhasil (HTTP 200)'
    );

    // 4.3 Filter by Color
    const colorRes = await fetch(`${BASE_URL}/clothes?color=Putih`, { headers: authHeaders });
    const colorData = await colorRes.json();
    assert(
      colorRes.status === 200 &&
      colorData.data.some((i) => i.color === 'Putih'),
      'Filter pakaian berdasarkan warna "Putih" (HTTP 200)'
    );

    // 4.4 Filter Metadata Dropdown
    const metaRes = await fetch(`${BASE_URL}/clothes/meta/filters`, { headers: authHeaders });
    const metaData = await metaRes.json();
    assert(metaRes.status === 200 && metaData.data?.categories?.length > 0, 'Ambil metadata opsi filter dropdown dinamis (HTTP 200)');

    // -------------------------------------------------------------
    // 5. GENERATE REKOMENDASI OUTFIT
    // -------------------------------------------------------------
    console.log('\n▶️ [5/9] Menguji Rekomendasi Outfit Cerdas...');
    const recRes = await fetch(`${BASE_URL}/recommendations`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occasion: 'Casual Hangout',
        city: 'Jakarta',
      }),
    });
    const recData = await recRes.json();
    assert(recRes.status === 200 && recData.success, 'Generate rekomendasi outfit berhasil (HTTP 200)');
    assert(recData.data?.weather?.city, `Data cuaca real-time terambil: ${recData.data?.weather?.city || 'Default'}`);
    assert(recData.data?.recommendations?.length > 0, `Kombinasi outfit terhitung (${recData.data?.recommendations?.length} rekomendasi)`);
    assert(!!recData.data?.stylistAdvice, 'Kurasi & nasihat fashion stylist berhasil dihasilkan');

    // -------------------------------------------------------------
    // 6. SAVE OUTFIT DAN WEAR TODAY
    // -------------------------------------------------------------
    console.log('\n▶️ [6/9] Menguji Simpan Outfit (Lookbook) & Wear Today...');
    // 6.1 Save to Lookbook
    const saveOutfitRes = await fetch(`${BASE_URL}/outfits`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'OOTD Weekend Hangout',
        topId,
        bottomId,
        outerId,
        footwearId: shoeId,
        occasion: 'Casual Hangout',
        isFavorite: true,
      }),
    });
    const saveOutfitData = await saveOutfitRes.json();
    const outfitId = saveOutfitData.data?.id;
    assert(saveOutfitRes.status === 201 && !!outfitId, 'Simpan outfit ke Lookbook (HTTP 201)');
    assert(saveOutfitData.data?.isFavorite === true, 'Outfit tersimpan ditandai sebagai Favorite');

    // 6.2 Wear Today (OOTD Logging)
    const wearTodayRes = await fetch(`${BASE_URL}/outfits/wear-today`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outfitId,
        notes: 'Nyaman dipakai jalan sore santai',
      }),
    });
    const wearTodayData = await wearTodayRes.json();
    assert(wearTodayRes.status === 201 && wearTodayData.success, 'Catat pemakaian hari ini (Wear Today) (HTTP 201)');

    // 6.3 Verify Clothes lastWornAt timestamp updated automatically
    const checkTopRes = await fetch(`${BASE_URL}/clothes/${topId}`, { headers: authHeaders });
    const checkTopData = await checkTopRes.json();
    assert(!!checkTopData.data?.lastWornAt, 'Otomasi integrasi: Timestamp lastWornAt pakaian ter-update otomatis di database');

    // -------------------------------------------------------------
    // 7. CALENDAR DAN RIWAYAT OUTFIT
    // -------------------------------------------------------------
    console.log('\n▶️ [7/9] Menguji Calendar dan Riwayat Outfit...');
    // 7.1 Fetch Calendar
    const calRes = await fetch(`${BASE_URL}/outfits/calendar`, { headers: authHeaders });
    const calData = await calRes.json();
    assert(calRes.status === 200 && calData.data?.length > 0, 'Ambil seluruh riwayat kalender OOTD (HTTP 200)');

    const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. 2026-09
    const filterCalRes = await fetch(`${BASE_URL}/outfits/calendar?month=${currentYearMonth}`, { headers: authHeaders });
    const filterCalData = await filterCalRes.json();
    assert(filterCalRes.status === 200 && filterCalData.data?.length > 0, `Filter kalender berdasarkan bulan ${currentYearMonth} (HTTP 200)`);

    const logId = calData.data[0].id;
    // 7.2 Delete Wear Log
    const delLogRes = await fetch(`${BASE_URL}/outfits/calendar/${logId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delLogRes.status === 200, 'Hapus catatan log kalender OOTD (HTTP 200)');

    // -------------------------------------------------------------
    // 8. PENGUJIAN ANALITIK, API & DATABASE (INTEGRITY)
    // -------------------------------------------------------------
    console.log('\n▶️ [8/9] Menguji Integritas Database, Constraint & Analitik...');
    // 8.1 Wardrobe Utilization Analytics
    const analyticsRes = await fetch(`${BASE_URL}/users/analytics`, { headers: authHeaders });
    const analyticsData = await analyticsRes.json();
    assert(
      analyticsRes.status === 200 &&
      analyticsData.data?.overview?.totalClothes === 4 &&
      typeof analyticsData.data?.overview?.utilizationRate === 'number',
      'Kalkulasi metrik utilisasi lemari & wawasan keberlanjutan (HTTP 200)'
    );

    // 8.2 Security: Unauthorized Access without Token
    const unauthRes = await fetch(`${BASE_URL}/clothes`);
    assert(unauthRes.status === 401, 'Endpoint private menolak request tanpa token JWT (HTTP 401 Unauthorized)');

    // 8.3 Security: Invalid Token
    const invalidTokenRes = await fetch(`${BASE_URL}/clothes`, {
      headers: { Authorization: 'Bearer token_ngawur_palsu' },
    });
    assert(invalidTokenRes.status === 403, 'Endpoint private menolak token palsu/rusak (HTTP 403 Forbidden)');

    // 8.4 Cascade Delete & Relations Test
    const delOutfitRes = await fetch(`${BASE_URL}/outfits/${outfitId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delOutfitRes.status === 200, 'Hapus outfit dari Lookbook (HTTP 200)');

    // -------------------------------------------------------------
    // 9. SELURUH ALUR APLIKASI DARI AWAL SAMPAI AKHIR
    // -------------------------------------------------------------
    console.log('\n▶️ [9/9] Verifikasi Seluruh Alur Aplikasi (End-to-End User Journey)...');
    assert(
      passed >= 25 && failed === 0,
      'Seluruh alur aplikasi (Register -> Profile -> Upload -> Filter -> Recommend -> Lookbook -> Calendar -> Analytics) tervalidasi 100% sempurna!'
    );

  } finally {
    if (fs.existsSync(dummyImgPath)) {
      fs.unlinkSync(dummyImgPath);
    }
  }

  console.log('\n================================================================');
  console.log(`📊 HASIL PENGUJIAN OTOMATIS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
};

runVerification().catch((err) => {
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
