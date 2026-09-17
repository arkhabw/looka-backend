# Looka - Backend API Service

> **Intelligent Digital Closet & Multimedia-Driven Outfit Recommendation Web Platform**  
> Projek Akhir Kelas Web Development - Web Developer KSM Multimedia 2026

---

## Deskripsi Singkat
Layanan backend RESTful API untuk **Looka**, platform asisten lemari digital pribadi yang membantu pengguna mengelola katalog pakaian mereka, menganalisis kombinasi pakaian, menghasilkan rekomendasi outfit harian (OOTD) cerdas berbasis cuaca real-time dan kurasi Google Gemini AI, menyimpan lookbook favorit, kalender pemakaian OOTD, serta analitik utilisasi lemari.

- **Repositori Frontend:** [looka-frontend](https://github.com/arkhabw/looka-frontend)
- **Panduan Integrasi Front-End:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) *(Dokumentasi resmi serah terima API untuk developer FE)*

---

## Tech Stack Wajib
Sesuai dengan Panduan Resmi KSM Multimedia 2026:
- **Runtime Environment:** Node.js (v20+ / ES Modules)
- **Web Framework:** Express.js
- **Database Relasional:** PostgreSQL 16
- **ORM & Migrasi:** Drizzle ORM (`drizzle-orm`) & Drizzle Kit (`drizzle-kit`)
- **Autentikasi & Keamanan:** JSON Web Token (`jsonwebtoken`) & password hashing (`bcryptjs`)
- **Validasi Data:** Zod (`zod`)
- **File Upload:** Multer (`multer`)
- **AI & Integrasi Eksternal:**
  - Google Gemini AI (`@google/genai`) - Model: `gemini-3.6-flash` (dengan fallback ke `gemini-3.5-flash-lite` dan *rule-based engine*)
  - OpenWeatherMap API (Weather real-time dengan fallback tropis)
- **Containerization:** Docker & Docker Compose
- **Dokumentasi Kontrak API:** Postman Collection (`postman/Looka_API.postman_collection.json`)

---

## Struktur Direktori (Layered Architecture)
```text
looka-backend/
|-- postman/
|   `-- Looka_API.postman_collection.json   # Dokumentasi kontrak API untuk FE
|-- src/
|   |-- config/
|   |   |-- db.js                           # Koneksi pool PostgreSQL & Drizzle ORM
|   |   `-- env.js                          # Validasi konfigurasi environment
|   |-- controllers/
|   |   |-- auth.controller.js              # Register, Login, Me, Update Profile
|   |   |-- clothes.controller.js           # Clothes CRUD, multi-filter, search, upload
|   |   |-- health.controller.js            # Controller status sistem
|   |   |-- outfit.controller.js            # Outfits CRUD, favorites, OOTD calendar
|   |   |-- recommendation.controller.js    # Rekomendasi outfit & AI Stylist
|   |   `-- user.controller.js              # Wardrobe utilization analytics
|   |-- db/
|   |   `-- schema.js                       # Skema tabel Drizzle ORM (Users, Clothes, Outfits, Logs)
|   |-- middlewares/
|   |   |-- auth.middleware.js              # Verifikasi token JWT Bearer
|   |   |-- error.middleware.js             # 404 Handler & Global Error Handler terpusat
|   |   |-- upload.middleware.js            # Multer upload & image validation
|   |   `-- validate.middleware.js          # Zod schema request body validator
|   |-- routes/
|   |   |-- auth.routes.js                  # Route /api/auth
|   |   |-- clothes.routes.js               # Route /api/clothes
|   |   |-- health.routes.js                # Route /api/health
|   |   |-- index.js                        # Root API router
|   |   |-- outfit.routes.js                # Route /api/outfits
|   |   |-- recommendation.routes.js        # Route /api/recommendations
|   |   `-- user.routes.js                  # Route /api/users
|   |-- services/
|   |   |-- analytics.service.js            # Kalkulasi metrik utilisasi & wawasan lemari
|   |   |-- colorHarmony.service.js         # Teori harmoni warna pakaian
|   |   |-- gemini.service.js               # Kurasi gaya personal Google Gemini AI
|   |   |-- recommendation.service.js       # Mesin kombinatorika & scoring rekomendasi
|   |   `-- weather.service.js              # Fetch data cuaca real-time OpenWeatherMap
|   |-- utils/
|   |   `-- response.js                     # Standardizer format respons JSON
|   |-- app.js                              # Inisialisasi Express, CORS, static uploads
|   `-- server.js                           # Entry point server & graceful shutdown
|-- tests/
|   |-- analytics.test.mjs                  # Test suite analitik utilisasi lemari
|   |-- outfits.test.mjs                    # Test suite outfits CRUD & OOTD calendar
|   |-- recommendations.test.mjs            # Test suite rekomendasi & Gemini AI
|   `-- runner.mjs                          # Test runner terpusat (81 test cases)
|-- uploads/                                # Direktori penyimpanan file gambar pakaian
|   `-- .gitkeep
|-- .env.example                            # Template variabel environment
|-- .gitignore
|-- docker-compose.yml                      # PostgreSQL container setup
|-- Dockerfile                              # Production backend containerization
|-- drizzle.config.js                       # Konfigurasi Drizzle Kit
|-- FRONTEND_INTEGRATION_GUIDE.md           # Panduan lengkap integrasi Front-End
|-- package.json
`-- README.md
```

---

## Panduan Memulai (Getting Started)

### 1. Prasyarat
- Node.js (v20 atau lebih baru)
- Docker Desktop (untuk container database PostgreSQL)

### 2. Jalankan Database PostgreSQL
```bash
docker-compose up -d
```
Container `looka_postgres_db` akan berjalan di port `5432`.

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variable
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi `.env`:
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://looka:looka123password@localhost:5432/looka_db
JWT_SECRET=supersecretjwtkey_looka_2026_ksm_multimedia
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
OPENWEATHER_API_KEY=your_openweather_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Push Skema Basis Data (Drizzle Kit)
```bash
npm run db:push
```

### 6. Menjalankan Server Development
```bash
npm run dev
```
Server akan aktif di: `http://localhost:5001`  
Uji status kesehatan sistem: `http://localhost:5001/api/health`

---

## Menjalankan Pengujian Otomatis (Automated Tests)
Semua modul telah dilengkapi integration test otomatis end-to-end:
```bash
npm test
```
*Total 81 test cases otomatis meliputi autentikasi, manajemen pakaian, mesin rekomendasi AI, Lookbook, kalender pemakaian OOTD, dan analitik utilisasi lemari.*

---

## Dokumentasi API untuk Front-End
- **Panduan Integrasi Front-End:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
- **Postman Collection:** `postman/Looka_API.postman_collection.json`
