# LOOKA — MASTER PROJECT KNOWLEDGE BASE & SYSTEM RECAP
> Dokumen ini adalah rangkuman pengetahuan komprehensif (*Master Context & Architecture Reference*) untuk proyek **Looka**. Dokumen ini dirancang agar pengembang baru, rekan tim, maupun agen AI lain (Claude, Cursor, Copilot, ChatGPT, Gemini, dll.) dapat langsung memahami seluruh arsitektur, basis data, alur bisnis, konfigurasi lingkungan, keputusan desain, dan cara kerja sistem tanpa kehilangan konteks.

---

## 1. Ringkasan Eksekutif & Identitas Proyek

* **Nama Proyek**: **Looka** (*Intelligent Digital Closet & Outfit Recommender Web Platform*)
* **Tagline**: *"Make the most of what you own — Smart Wardrobe, Brighter Days."*
* **Tujuan**: Platform web lemari digital cerdas berbasis AI yang membantu pengguna mendokumentasikan koleksi busana pribadi, merencanakan padu-padan outfit harian (*Lookbook & Calendar Tracker*), memantau statistik pemakaian (*Wardrobe Utilization Analytics*), serta mendapatkan rekomendasi setelan pakaian yang dipersonalisasi berdasarkan cuaca riil lokasi dan teori harmoni warna oleh asisten AI Stylist (*Luca*).
* **Mata Kuliah / Konteks**: Projek Akhir Mata Kuliah Multimedia (KSM Multimedia 2026).
* **Susunan Tim Pengembang (2 Orang)**:
  1. **Arkha Bima Wicaksono (`arkhabw`)**: Back-End Engineer, Database Architect, & AI Engine Integration.
  2. **Astrella Surya (`astrellasr`)**: Front-End Developer & UI/UX Designer.
* **Aturan Khusus Proyek**:
  * **Zero Emojis**: Dilarang menggunakan emoji apa pun pada kode sumber, komentar, berkas log, pesan commit git, maupun respons chat.
  * **No Sprint Tags in Commits**: Jangan gunakan prefix hari/sprint (misal: `[Day 1]`, `Sprint 2`) pada pesan commit git. Gunakan konvensi *Conventional Commits* (`feat:`, `fix:`, `chore:`, `docs:`).

---

## 2. Struktur Repositori & Workspace

Proyek ini memiliki 3 folder kerja di dalam direktori `FINALPROJECT`:

```
FINALPROJECT/
├── looka-backend/       # Repositori independen Back-End (Git Remote: arkhabw/looka-backend.git)
├── looka-frontend/      # Repositori independen Front-End (Git Remote: astrellasr/looka-frontend.git)
├── looka-fullstack/     # Repositori Monorepo terpadu (berisi backend/ + frontend/ + docker-compose.yml)
├── Looka_Slide_Presentasi.pptx # Slide presentasi PowerPoint 16:9 siap pakai
├── Looka_Slide_Presentasi.html # Slide presentasi interaktif web (fullscreen + keyboard support)
├── Looka_Naskah_Video_Demo.md  # Naskah video demonstrasi 5-7 menit
├── Looka_Slide_Presentasi_KSM.md # Materi outline presentasi KSM
└── PROJECT_KNOWLEDGE_BASE.md   # Dokumen ini (Master Recap)
```

---

## 3. Tech Stack & Ekosistem Teknologi

### A. Front-End (`looka-frontend`)
* **Framework**: React 19 dengan Vite sebagai build tool & HMR server (Port `5173`).
* **Styling**: Tailwind CSS v4 dengan Looka Design Tokens terpusat di `src/index.css`.
* **Routing**: React Router DOM v7 (SPA routing client-side dengan `vercel.json` rewrites).
* **HTTP Client**: Axios dengan request/response interceptors (auto-attach Bearer Token JWT & error normalization di `src/api/axios.js`).
* **State Management**: React Context API (`AuthProvider` untuk sesi autentikasi dan `PreviewDataProvider` untuk preview mode).
* **Linter**: Oxlint.

### B. Back-End (`looka-backend`)
* **Runtime & Framework**: Node.js v20+ dengan Express.js v5 (Port `5001`).
* **Database ORM**: Drizzle ORM (`drizzle-orm` + `drizzle-kit`) dengan PostgreSQL driver `pg`.
* **Autentikasi & Keamanan**:
  * JSON Web Token (`jsonwebtoken`) untuk stateless authentication (masa aktif 7 hari).
  * `bcryptjs` untuk one-way hashing password dengan salt rounds 10.
  * Dukungan login fleksibel: menerima **email** (`demo@looka.id`) atau **username** (`Stella`).
* **Validasi Data**: Zod v4 (`zod`) dengan middleware penangkap validasi terpusat.
* **Unggah Gambar**: Multer + `multer-storage-cloudinary` dengan fallback ke penyimpanan disk lokal.
* **CORS**: Pustaka `cors` yang fleksibel, mengizinkan localhost (`5173`, `3000`), `CLIENT_URL`, serta domain preview Vercel (`*.vercel.app`) dan Netlify (`*.netlify.app`).

### C. Basis Data & Layanan Cloud
* **Basis Data**: PostgreSQL 16 (Lokal via Docker Compose di port `5432` / Cloud via Neon.tech dengan auto-detect SSL).
* **Penyimpanan Media (Cloudinary)**:
  * Akun: `p5fswgcx`
  * Folder tujuan: `looka_clothes`
  * Otomatisasi: Upload menghasilkan HTTPS URL CDN; update/delete pakaian otomatis membersihkan aset lama di Cloudinary (`deleteFromCloudinary`).
* **Artificial Intelligence**: Google Gemini 3.6 Flash via `@google/genai` (menghasilkan *Luca's Style Note* dengan fallback rule-based engine).
* **Weather API**: OpenWeatherMap API (membaca suhu dan cuaca riil per kota pengguna).

---

## 4. Desain Basis Data (Drizzle ORM Schema)

Skema relasional didefinisikan di [`looka-backend/src/db/schema.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/db/schema.js) menggunakan 4 tabel utama:

### 1. `users`
* `id` (Serial, Primary Key)
* `email` (Varchar 255, Unique, Not Null)
* `username` (Varchar 100, Not Null)
* `password` (Varchar 255, Not Null, Bcrypt hashed)
* `stylePreference` (Varchar 50, Default: 'Casual')
* `city` (Varchar 100, Default: 'Jakarta')
* `createdAt` / `updatedAt` (Timestamp)

### 2. `clothes`
* `id` (Serial, Primary Key)
* `userId` (Integer, Foreign Key -> `users.id` dengan onDelete: 'cascade')
* `name` (Varchar 255, Not Null)
* `category` (Varchar 50, Not Null — Enum: `'Tops'`, `'Bottoms'`, `'Outerwear'`, `'Footwear'`, `'Accessories'`)
* `color` (Varchar 100, Not Null)
* `style` (Varchar 50, Default: 'Casual')
* `occasion` (Varchar 50, Default: 'Casual Hangout')
* `weather` (Varchar 50, Default: 'All Weather')
* `imageUrl` (Varchar 500, Not Null — URL Cloudinary HTTPS atau filename lokal)
* `lastWornAt` (Timestamp, Nullable)
* `createdAt` / `updatedAt` (Timestamp)

### 3. `outfits`
* `id` (Serial, Primary Key)
* `userId` (Integer, Foreign Key -> `users.id` dengan onDelete: 'cascade')
* `name` (Varchar 255, Not Null)
* `topId` (Integer, Foreign Key -> `clothes.id`, Not Null)
* `bottomId` (Integer, Foreign Key -> `clothes.id`, Not Null)
* `outerId` (Integer, Foreign Key -> `clothes.id`, Nullable)
* `footwearId` (Integer, Foreign Key -> `clothes.id`, Nullable)
* `occasion` (Varchar 50, Default: 'Casual Hangout')
* `isFavorite` (Boolean, Default: false)
* `createdAt` (Timestamp)

### 4. `outfit_logs`
* `id` (Serial, Primary Key)
* `userId` (Integer, Foreign Key -> `users.id` dengan onDelete: 'cascade')
* `outfitId` (Integer, Foreign Key -> `outfits.id` dengan onDelete: 'cascade')
* `wornDate` (Varchar 10, Not Null — Format: `YYYY-MM-DD`)
* `notes` (Text, Nullable)
* `createdAt` (Timestamp)

---

## 5. Algoritma Rekomendasi Cerdas (Multi-Factor Scoring)

Logika rekomendasi beroperasi di [`looka-backend/src/services/recommendation.service.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/services/recommendation.service.js) dengan formula evaluasi multi-faktor (skor 0–100):

$$\text{Final Score} = (0.40 \times \text{Harmony}) + (0.30 \times \text{Weather}) + (0.20 \times \text{Occasion \& Style}) + (0.10 \times \text{Rotation})$$

1. **Harmoni Warna (Bobot 40%)** ([`colorHarmony.service.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/services/colorHarmony.service.js)):
   * Mengevaluasi relasi roda warna 12 segmen HSL: *Monochromatic*, *Complementary*, *Analogous*, *Classic Neutral*, dan *Pop Accent*.
2. **Kesesuaian Cuaca (Bobot 30%)** ([`weather.service.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/services/weather.service.js)):
   * Membaca suhu riil kota via OpenWeatherMap. Suhu dingin (< 24°C) atau hujan memprioritaskan pakaian tebal & outerwear; suhu panas (> 28°C) memprioritaskan pakaian berbahan sejuk tanpa outerwear tebal.
3. **Kesesuaian Acara & Gaya (Bobot 20%)**:
   * Mencocokkan metadata pakaian dengan agenda pengguna (*Casual Hangout, Campus, Work, Formal, Date, Weekend*).
4. **Rotasi Lemari (Bobot 10%)**:
   * Memberikan penalti bagi baju yang baru dipakai hari ini atau kemarin; memberikan bonus prioritas bagi pakaian yang jarang/belum pernah dipakai (*neglected items*).
5. **Fitur Pin/Lock Item & Shuffle**:
   * Pengguna dapat mengunci item spesifik (`lockedItemId`), sistem otomatis meracik pelengkap item lainnya.
   * Tombol *Shuffle* merotasi variasi setelan berikutnya.
6. **Luca AI Fashion Stylist**:
   * Disintesis oleh Google Gemini (`gemini.service.js`) untuk menghasilkan tips padu-padan berkelas sesuai suhu dan agenda. Jika API Gemini offline, sistem otomatis beralih ke *rule-based engine* tanpa error.

---

## 6. Daftar Kontrak API Endpoints

Seluruh endpoint diawali dengan prefiks `/api`:

| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :---: | :--- |
| **GET** | `/api/health` | Publik | Health check server, uptime, dan status koneksi database. |
| **POST** | `/api/auth/register` | Publik | Registrasi pengguna baru (name, email, password, stylePreference, city). |
| **POST** | `/api/auth/login` | Publik | Login pengguna (menerima email ATAU username, mengembalikan token JWT). |
| **GET** | `/api/auth/me` | Privat | Mendapatkan data profil pengguna yang sedang login. |
| **PUT** | `/api/auth/profile` | Privat | Memperbarui nama, style preference, atau kota domisili. |
| **PUT** | `/api/auth/password` | Privat | Mengubah kata sandi pengguna. |
| **GET** | `/api/clothes` | Privat | Mengambil daftar pakaian dengan multi-filter (kategori, warna, gaya, acara, sort). |
| **POST** | `/api/clothes` | Privat | Menambah pakaian baru dengan unggah foto multipart/form-data. |
| **GET** | `/api/clothes/:id` | Privat | Mendapatkan detail 1 item pakaian. |
| **PUT** | `/api/clothes/:id` | Privat | Memperbarui detail pakaian dan opsi penggantian foto baru. |
| **DELETE** | `/api/clothes/:id` | Privat | Menghapus pakaian dan membersihkan foto fisik di Cloudinary/disk. |
| **GET** | `/api/clothes/meta/filters`| Privat | Mendapatkan distinct filter metadata untuk dropdown antarmuka. |
| **GET** | `/api/outfits` | Privat | Mengambil daftar setelan lookbook (opsi filter `isFavorite=true`). |
| **POST** | `/api/outfits` | Privat | Menyimpan kombinasi pakaian ke lookbook pribadi. |
| **GET** | `/api/outfits/:id` | Privat | Mendapatkan detail setelan outfit dengan relasi pakaian lengkap. |
| **PUT** | `/api/outfits/:id` | Privat | Memperbarui setelan pakaian atau toggle status favorit. |
| **DELETE** | `/api/outfits/:id` | Privat | Menghapus setelan dari lookbook. |
| **POST** | `/api/outfits/wear-today` | Privat | Mencatat pemakaian outfit hari ini dan otomatis mengupdate `lastWornAt`. |
| **GET** | `/api/outfits/calendar` | Privat | Mengambil histori kalender pemakaian (opsi filter bulan `YYYY-MM`). |
| **DELETE** | `/api/outfits/calendar/:id`| Privat | Menghapus catatan riwayat pemakaian kalender. |
| **GET/POST**| `/api/recommendations` | Privat | Menghasilkan rekomendasi outfit adaptif cuaca, harmoni warna, dan AI review. |
| **GET** | `/api/users/analytics` | Privat | Menghitung tingkat utilisasi lemari, kategori breakdown, dan neglected items. |

---

## 7. Sistem Desain & Token Warna (Looka Design Tokens)

Didefinisikan di [`looka-frontend/src/index.css`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-frontend/src/index.css):
* **Canvas / Latar Belakang**: `#FAF8F5` (*Warm Soft Cream*)
* **Surface / Kartu**: `#FFFFFF` (*Crisp White*)
* **Surface Soft**: `#EDE7E1` (*Soft Neutral Container*)
* **Primary**: `#DDB5C4` (*Dusky Rose / Mauve Pink*)
* **Primary Strong**: `#CFA0B2` (*Deep Mauve Accent*)
* **Blush**: `#E5C4D0` (*Soft Tag Accent*)
* **Ink (Teks Utama)**: `#3D393B` (*Deep Charcoal Ink*)
* **Ink Soft (Teks Sekunder)**: `#777174` (*Taupe / Muted Ink*)
* **Border Line**: `#E8E3DF` (*Delicate Card Border*)
* **Pastel Chips**: `#BFD1C3` (Sage), `#E5C6B0` (Peach), `#C8BCD5` (Lavender), `#B8CEDD` (Powder Blue).
* **Tipografi**:
  * Judul: Editorial Serif (*"Iowan Old Style", "Palatino Linotype", Georgia, serif*).
  * Body: System UI Sans (*ui-sans-serif, system-ui, -apple-system, sans-serif*).
* **Penerapan 4 State UI Wajib**:
  1. *Loading State*: Skeleton screens & shimmering pulse.
  2. *Success State*: Kartu informasi dengan hierarki visual jelas.
  3. *Empty State*: Maskot Luca memandu aksi pertama (*Call-to-Action*).
  4. *Error State*: Pesan kegagalan ramah dengan tombol *Retry* tanpa membuat web crash.

---

## 8. Panduan Menjalankan Proyek Secara Lokal

### Prasyarat
* Node.js v20+
* Docker Desktop (untuk PostgreSQL)

### Langkah 1: Jalankan Database PostgreSQL
```bash
cd looka-backend
docker compose up postgres -d
```
Container `looka_postgres_db` akan aktif di port `5432`.

### Langkah 2: Menjalankan Backend
```bash
cd looka-backend
npm install

# Push skema tabel ke database & isi data demo
npm run db:push
npm run db:seed

# Jalankan server pengembangan
npm run dev
```
Server berjalan di `http://localhost:5001`. Cek kesehatan di `http://localhost:5001/api/health`.

### Langkah 3: Menjalankan Frontend
```bash
cd looka-frontend
npm install
npm run dev
```
Web app aktif di `http://localhost:5173`.

### Akun Demo Bawaan Seeder:
* **Email**: `demo@looka.id` (bisa juga login menggunakan username: `Stella`)
* **Password**: `Password123!`

---

## 9. Automated Testing & Verifikasi

Backend Looka dilengkapi dengan 81 automated integration tests tanpa ketergantungan data dummy:
```bash
cd looka-backend
npm test
```
* **Suite 1: Outfits CRUD & Calendar Tracker**: 37 tests (PASS)
* **Suite 2: Wardrobe Analytics & Utilization**: 25 tests (PASS)
* **Suite 3: Recommendation Engine, Weather API, & AI Stylist**: 19 tests (PASS)
* **Total**: **81 / 81 Tests Passed (100% SUCCESS)**.

---

## 10. Panduan Deployment ke Cloud

Sesuai ketentuan tugas KSM Multimedia, **deployment ke cloud bersifat opsional**, sedangkan **Docker Compose lokal adalah persyaratan utama penilaian**. Namun, seluruh codebase sudah siap 100% jika ingin dideploy online:

1. **Database Cloud**: Gunakan [Neon.tech](https://neon.tech) (PostgreSQL Serverless gratis). Drizzle ORM di [`src/config/db.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/config/db.js) sudah memiliki konfigurasi otomatis `ssl: { rejectUnauthorized: false }` untuk cloud DB.
2. **Backend**: Deploy ke [Render.com](https://render.com) (Web Service gratis) atau Vercel Serverless (sudah disediakan [`api/index.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/api/index.js) dan [`vercel.json`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/vercel.json)).
3. **Frontend**: Deploy ke [Vercel](https://vercel.com). Sudah dilengkapi [`vercel.json`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-frontend/vercel.json) untuk rewrite SPA routing agar tidak 404 saat refresh. Masukkan environment variable `VITE_API_BASE_URL` mengarah ke domain backend.
4. **Media Storage**: Tetap menggunakan Cloudinary yang sudah terintegrasi aktif.

---

## 11. Catatan Riwayat Keputusan & Perbaikan Kritis (Bug Fixes History)

1. **Fleksibilitas Identifier Login**:
   * Awalnya login hanya menerima format email, menyebabkan kegagalan saat pengguna mencoba login dengan username `Stella`.
   * Diperbaiki pada [`auth.validation.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/validations/auth.validation.js) dan [`auth.controller.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/controllers/auth.controller.js) sehingga menerima `identifier` (bisa email ataupun username).
2. **Penanganan Storage Cloudinary**:
   * `req.file.path` menyimpan URL Cloudinary HTTPS (`https://res.cloudinary.com/...`), sementara penyimpanan lokal menyimpan filename.
   * Helper [`imageUrl.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-frontend/src/utils/imageUrl.js) di frontend dan [`clothes.controller.js`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/controllers/clothes.controller.js) di backend sudah mendukung deteksi cerdas `path.startsWith('http')` dengan fallback lokal yang mulus.
3. **Pembersihan Aset Cloudinary**:
   * Saat pakaian diubah fotonya atau dihapus, aset gambar di server Cloudinary otomatis dihancurkan via `cloudinary.uploader.destroy()` melalui fungsi [`deleteFromCloudinary()`](file:///c:/Users/ASUS/Documents/GitHub/MULMED/FINALPROJECT/looka-backend/src/config/cloudinary.js).
4. **Dukungan SSL Database**:
   * `pg.Pool` di backend secara cerdas mendeteksi apakah URL database mengarah ke cloud (bukan localhost). Jika ya, opsi `ssl: { rejectUnauthorized: false }` otomatis diaktifkan untuk mencegah error sertifikat SSL di cloud.
5. **CORS Preview Vercel**:
   * Regex origin di `src/app.js` mengizinkan subdomain `*.vercel.app` dan `*.netlify.app` agar preview branch di Vercel tidak terkena insiden *Blocked by CORS Policy*.
