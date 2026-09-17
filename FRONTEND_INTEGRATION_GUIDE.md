# Panduan Integrasi Front-End API - Looka Platform

Dokumentasi resmi serah terima API (*API Handoff*) dari Back-End untuk Developer Front-End aplikasi **Looka** (*Intelligent Digital Closet & Outfit Recommender Web Platform*).

---

## 1. Spesifikasi Server & Konfigurasi Dasar

- **Base API URL:** `http://localhost:5001/api`
- **Static File / Image URL:** `http://localhost:5001/uploads/{filename}`
- **CORS Origin Whitelist:** `http://localhost:5173` (Vite React Default)
- **Postman Collection File:** [postman/Looka_API.postman_collection.json](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/postman/Looka_API.postman_collection.json)

> [!NOTE]
> Server Back-End berjalan di **Port 5001** (bukan 5000) untuk menghindari konflik port sistem pada Windows.

---

## 2. Standar Format Respons JSON

Seluruh respons dari server menggunakan format konsisten:

### Respons Berhasil (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Pesan deskriptif keberhasilan",
  "data": { ... },
  "meta": { ... } // Opsional: pagination atau metadata filter
}
```

### Respons Gagal / Error (HTTP 400, 401, 403, 404, 500)
```json
{
  "success": false,
  "message": "Pesan error deskriptif yang aman ditampilkan ke user",
  "errors": [
    { "field": "name", "message": "Nama pakaian wajib diisi" }
  ]
}
```

---

## 3. Rekomendasi Setup Client (Axios Helper)

Berikut adalah template konfigurasi Axios siap pakai untuk Front-End (`src/services/api.js`):

```javascript
import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5001/api';
export const UPLOAD_BASE_URL = 'http://localhost:5001/uploads';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request Interceptor: Otomatis lampirkan token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('looka_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Tangani 401 Unauthorized secara global
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('looka_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

// Helper untuk URL gambar pakaian
export const getClothingImageUrl = (filename) => {
  if (!filename) return '/images/clothing-placeholder.png';
  if (filename.startsWith('http')) return filename;
  return `${UPLOAD_BASE_URL}/${filename}`;
};
```

---

## 4. Pemetaan Endpoint per Halaman / Komponen UI

### Halaman 1: Autentikasi & Profil Pengguna

#### A. Registrasi Pengguna
- **Method & URL:** `POST /api/auth/register`
- **Body (JSON):**
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "Password123!",
    "stylePreference": "Casual", // Opsional: Casual, Formal, Streetwear, Minimalist
    "city": "Jakarta"            // Opsional (default: Jakarta)
  }
  ```
- **Respons (201):** Mengembalikan `{ user: { id, username, email, stylePreference, city }, token }`.
- *Catatan FE:* Simpan `token` ke `localStorage.setItem('looka_token', token)`.

#### B. Login Pengguna
- **Method & URL:** `POST /api/auth/login`
- **Body (JSON):**
  ```json
  {
    "email": "john@example.com",
    "password": "Password123!"
  }
  ```
- **Respons (200):** Mengembalikan `{ user, token }`.

#### C. Get Profil Pengguna (Current User / Me)
- **Method & URL:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Respons (200):** Data pengguna saat ini.

#### D. Update Profil Pengguna
- **Method & URL:** `PUT /api/auth/profile`
- **Body (JSON):** `{ "username": "...", "stylePreference": "Streetwear", "city": "Bandung" }`

---

### Halaman 2: Lemari Pakaian Digital (Digital Wardrobe)

#### A. Metadata Opsi Filter (Dropdown Filter Drawer)
- **Method & URL:** `GET /api/clothes/meta/filters`
- **Headers:** `Authorization: Bearer <token>`
- **Respons (200):**
  ```json
  {
    "success": true,
    "data": {
      "categories": ["Tops", "Bottoms", "Outerwear", "Footwear", "Accessories"],
      "styles": ["Casual", "Formal", "Streetwear", "Minimalist", "Sporty", "Vintage"],
      "occasions": ["Casual Hangout", "Work", "Formal Event", "Sports / Gym", "Party", "Date Night"],
      "weathers": ["All Weather", "Hot", "Cold", "Rainy"]
    }
  }
  ```
- *Catatan FE:* Gunakan endpoint ini saat *mount* halaman lemari untuk mengisi opsi `<select>` atau *filter chips* secara dinamis.

#### B. Ambil Koleksi Pakaian (Dengan Filter, Search, & Sort)
- **Method & URL:** `GET /api/clothes`
- **Query Parameters (Semua Opsional):**
  - `category`: `Tops` | `Bottoms` | `Outerwear` | `Footwear` | `Accessories`
  - `color`: `Hitam` | `Putih` | `Navy` | dll.
  - `style`: `Casual` | `Formal` | dll.
  - `occasion`: `Casual Hangout` | `Work` | dll.
  - `search`: kata kunci nama pakaian (misal `?search=kemeja`)
  - `sort`: `newest` (default) | `oldest` | `name_asc` | `name_desc` | `last_worn`
- **Contoh URL:** `GET /api/clothes?category=Tops&search=kaos&sort=newest`
- **Respons (200):** Array pakaian milik user dengan `meta.total`.

#### C. Tambah Pakaian Baru (Upload Foto)
- **Method & URL:** `POST /api/clothes`
- **Content-Type:** `multipart/form-data`
- **Form Data Fields:**
  - `name` (string, wajib): misal `"Kaos Putih Katun"`
  - `category` (string, wajib): salah satu dari `Tops`, `Bottoms`, `Outerwear`, `Footwear`, `Accessories`
  - `color` (string, wajib): misal `"Putih"`
  - `style` (string, opsional, default: `"Casual"`): misal `"Streetwear"`
  - `occasion` (string, opsional, default: `"Casual Hangout"`)
  - `weather` (string, opsional, default: `"All Weather"`): `Hot` | `Cold` | `Rainy` | `All Weather`
  - `image` (file, wajib): Gambar format JPG, PNG, atau WEBP (maksimal 5MB).
- **Contoh Kode FE:**
  ```javascript
  const formData = new FormData();
  formData.append('name', name);
  formData.append('category', category);
  formData.append('color', color);
  formData.append('style', style);
  formData.append('occasion', occasion);
  formData.append('weather', weather);
  formData.append('image', fileInput.files[0]);

  await api.post('/clothes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  ```

#### D. Detail Pakaian
- **Method & URL:** `GET /api/clothes/:id`

#### E. Edit Pakaian (Update Metadata / Ganti Foto)
- **Method & URL:** `PUT /api/clothes/:id`
- **Content-Type:** `multipart/form-data` atau `application/json`
- *Catatan:* Jika ingin mengganti foto, sertakan field `image`. Jika tidak mengganti foto, cukup kirimkan text field yang ingin diubah.

#### F. Hapus Pakaian
- **Method & URL:** `DELETE /api/clothes/:id`
- *Catatan:* Server otomatis menghapus file foto fisik dari disk server.

---

### Halaman 3: Mesin Rekomendasi Outfit Harian (OOTD Recommender)

Endpoint cerdas yang mengevaluasi kombinasi pakaian berdasarkan Teori Harmoni Warna (40%), Cuaca OpenWeatherMap (30%), Acara & Preferensi Gaya (20%), serta Rotasi Lemari (10%), lalu dikurasi oleh AI Fashion Stylist Google Gemini 3.6 Flash.

- **Method & URL:** `POST /api/recommendations` (atau `GET /api/recommendations`)
- **Body (JSON - Semua Opsional):**
  ```json
  {
    "occasion": "Casual Hangout", // Acara yang ingin dihadiri
    "city": "Jakarta",            // Kota untuk penyesuaian cuaca (default: kota user)
    "lockedItemId": 14            // (Fitur Pin): Kunci 1 pakaian tertentu yang ingin dipakai
  }
  ```
- **Contoh Format Respons (200):**
  ```json
  {
    "success": true,
    "message": "Rekomendasi outfit berhasil dihitung",
    "data": {
      "weather": {
        "city": "Jakarta",
        "temperature": 32,
        "condition": "Clouds",
        "description": "awan pecah",
        "icon": "04d",
        "isRain": false,
        "isCold": false,
        "isHot": true,
        "source": "openweathermap_api"
      },
      "occasion": "Casual Hangout",
      "city": "Jakarta",
      "recommendationsCount": 3,
      "recommendations": [
        {
          "score": 94,
          "harmonyScore": 95,
          "harmonyType": "Classic Neutral",
          "weatherScore": 90,
          "occasionScore": 95,
          "rotationScore": 85,
          "matchReason": "Pilihan tepat dengan harmoni warna classic neutral yang memikat, sangat nyaman untuk cuaca Jakarta (32°C), sesuai tema Casual Hangout.",
          "top": {
            "id": 1,
            "name": "Kaos Putih Katun",
            "category": "Tops",
            "color": "Putih",
            "imageUrl": "clothing-1789529258795-542128356.png"
          },
          "bottom": {
            "id": 3,
            "name": "Celana Hitam Chino",
            "category": "Bottoms",
            "color": "Hitam",
            "imageUrl": "clothing-1789529258814-463778771.png"
          },
          "outer": null,
          "footwear": {
            "id": 4,
            "name": "Sneakers Putih Low",
            "category": "Footwear",
            "color": "Putih",
            "imageUrl": "clothing-1789529258836-694300713.png"
          }
        }
      ],
      "stylistAdvice": "Pilihan Classic Neutral ini sangat sempurna untuk hangout santai di tengah cuaca Jakarta yang hangat... Styling tip: Masukkan sedikit bagian depan kaos ke dalam celana (french-tuck) untuk siluet tubuh yang lebih proporsional.",
      "stylistSource": "gemini_ai"
    }
  }
  ```

---

### Halaman 4: Lookbook & Outfit Tersimpan (Favorites)

Pengguna dapat menyimpan kombinasi rekomendasi di atas atau meramu sendiri pakaian ke dalam Lookbook.

#### A. Simpan Outfit ke Lookbook
- **Method & URL:** `POST /api/outfits`
- **Body (JSON):**
  ```json
  {
    "name": "Casual Senopati Look",
    "topId": 1,
    "bottomId": 3,
    "outerId": null,
    "footwearId": 4,
    "occasion": "Casual Hangout",
    "isFavorite": true
  }
  ```
- **Respons (201):** Data outfit tersimpan lengkap dengan relasi objek pakaian `top`, `bottom`, `outer`, dan `footwear`.

#### B. Daftar Outfit Tersimpan
- **Method & URL:** `GET /api/outfits`
- **Query Parameters:**
  - `isFavorite=true`: Filter hanya outfit favorit pengguna.
  - `search=...`: Pencarian nama outfit.
  - `occasion=...`: Filter berdasarkan tema agenda.

#### C. Detail, Edit, & Hapus Outfit
- `GET /api/outfits/:id`: Ambil detail satu outfit.
- `PUT /api/outfits/:id`: Edit nama, status favorit, atau kombinasi pakaian.
- `DELETE /api/outfits/:id`: Hapus outfit dari Lookbook.

---

### Halaman 5: Kalender OOTD & Pelacak Pemakaian (Wear Today)

Ketika pengguna menandai outfit sebagai "Dipakai Hari Ini", sistem mencatatnya ke kalender dan otomatis memperbarui status `lastWornAt` di lemari pakaian.

#### A. Catat Pemakaian Hari Ini (Wear Today)
- **Method & URL:** `POST /api/outfits/wear-today`
- **Body (JSON):**
  ```json
  {
    "outfitId": 5,                 // Opsional jika memilih outfit dari Lookbook
    "topId": 1,                    // Atau tentukan item langsung jika bukan dari outfit tersimpan
    "bottomId": 3,
    "wornDate": "2026-09-17",      // Format YYYY-MM-DD (opsional, default: hari ini)
    "notes": "Dipakai untuk presentasi projek akhir di kampus." // Opsional (maks 500 karakter)
  }
  ```
- **Respons (201):** Mengembalikan data log kalender dan `updatedItemsCount`.

#### B. Ambil Histori Kalender OOTD
- **Method & URL:** `GET /api/outfits/calendar`
- **Query Parameter:**
  - `month=YYYY-MM`: Filter berdasarkan bulan (misal `?month=2026-09`). Jika dihilangkan, mengembalikan seluruh histori terurut dari yang terbaru.
- **Respons (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 12,
        "wornDate": "2026-09-17",
        "notes": "Dipakai untuk presentasi projek akhir di kampus.",
        "outfit": {
          "id": 5,
          "name": "Casual Senopati Look",
          "top": { "id": 1, "name": "Kaos Putih Katun", "imageUrl": "..." },
          "bottom": { "id": 3, "name": "Celana Hitam Chino", "imageUrl": "..." },
          "outer": null,
          "footwear": { "id": 4, "name": "Sneakers Putih Low", "imageUrl": "..." }
        }
      }
    ],
    "meta": {
      "total": 1,
      "filterMonth": "2026-09"
    }
  }
  ```

#### C. Hapus Catatan Kalender
- **Method & URL:** `DELETE /api/outfits/calendar/:logId`

---

### Halaman 6: Dashboard Analitik Lemari (Wardrobe Analytics)

Menyajikan metrik visual untuk dashboard: rasio utilisasi pakaian, grafik kategori, palet warna, dan daftar pakaian menganggur (*neglected items*).

- **Method & URL:** `GET /api/users/analytics`
- **Headers:** `Authorization: Bearer <token>`
- **Contoh Format Respons (200):**
  ```json
  {
    "success": true,
    "message": "Analitik pemanfaatan lemari berhasil diambil.",
    "data": {
      "overview": {
        "totalClothes": 14,
        "totalOutfits": 4,
        "totalWornLogs": 8,
        "wornClothesCount": 9,
        "unwornClothesCount": 5,
        "utilizationRate": 64
      },
      "categoryBreakdown": [
        { "category": "Tops", "count": 6, "percentage": 43 },
        { "category": "Bottoms", "count": 4, "percentage": 29 },
        { "category": "Outerwear", "count": 2, "percentage": 14 },
        { "category": "Footwear", "count": 2, "percentage": 14 }
      ],
      "colorBreakdown": [
        { "color": "Hitam", "count": 5, "percentage": 36 },
        { "color": "Putih", "count": 4, "percentage": 29 },
        { "color": "Navy", "count": 3, "percentage": 21 },
        { "color": "Krem", "count": 2, "percentage": 14 }
      ],
      "mostWornItems": [
        {
          "id": 1,
          "name": "Kaos Putih Katun",
          "category": "Tops",
          "color": "Putih",
          "imageUrl": "...",
          "wearCount": 5
        }
      ],
      "neglectedItems": [
        {
          "id": 8,
          "name": "Kemeja Flanel Merah",
          "category": "Tops",
          "color": "Merah",
          "imageUrl": "...",
          "lastWornAt": null,
          "wearCount": 0
        }
      ],
      "sustainabilityInsight": "Tingkat pemanfaatan lemari Anda sebesar 64%. Coba kenakan pakaian yang belum pernah dipakai minggu ini untuk merotasi gaya Anda."
    }
  }
  ```

---

## 5. Ringkasan Status Code HTTP

| Status Code | Makna | Keterangan untuk FE |
| :--- | :--- | :--- |
| **200 OK** | Request berhasil | Tampilkan data normal |
| **201 Created** | Data baru tersimpan | Berikan toast notifikasi sukses (misal: "Pakaian berhasil diunggah") |
| **400 Bad Request** | Validasi input gagal / lemari belum lengkap | Tampilkan pesan `message` atau detail `errors[i].message` ke input form |
| **401 Unauthorized** | Token tidak ada / kedaluwarsa | Bersihkan `localStorage` dan redirect pengguna ke `/login` |
| **403 Forbidden** | Token tidak valid | Redirect ke `/login` |
| **404 Not Found** | Data tidak ditemukan | Tampilkan *empty state* atau redirect ke halaman 404 |
| **500 Server Error** | Terjadi kesalahan tak terduga | Tampilkan toast error ramah pengguna |
