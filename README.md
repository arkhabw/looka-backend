# Looka - Backend API Service

> **Intelligent Digital Closet & Multimedia-Driven Outfit Recommendation Web Platform**  
> Projek Akhir Kelas Web Development - Web Developer KSM Multimedia 2026

---

## Deskripsi Singkat
Layanan backend RESTful API untuk **Looka**, platform asisten lemari digital pribadi yang membantu pengguna mengelola katalog pakaian mereka, menganalisis kombinasi pakaian, dan menghasilkan rekomendasi outfit harian (OOTD) yang cerdas berdasarkan cuaca real-time dan konteks acara.

Repositori Frontend: [looka-frontend](https://github.com/arkhabw/looka-frontend)

---

## Tech Stack Wajib
Sesuai dengan Panduan Resmi KSM Multimedia 2026:
- **Runtime Environment:** Node.js (v20+ / ES Modules)
- **Web Framework:** Express.js
- **Database Relasional:** PostgreSQL
- **ORM & Migrasi:** Drizzle ORM (`drizzle-orm`) & Drizzle Kit (`drizzle-kit`)
- **Autentikasi & Keamanan:** JSON Web Token (`jsonwebtoken`) & password hashing (`bcryptjs`)
- **Validasi Data:** Zod (`zod`)
- **File Upload:** Multer (`multer`)
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
|   |   `-- health.controller.js            # Controller status sistem
|   |-- db/
|   |   `-- schema.js                       # Skema tabel Drizzle ORM (Users, Clothes, Outfits, Logs)
|   |-- middlewares/
|   |   |-- auth.middleware.js              # Verifikasi token JWT Bearer
|   |   `-- error.middleware.js             # 404 Handler & Global Error Handler terpusat
|   |-- routes/
|   |   |-- health.routes.js                # Route /api/health
|   |   `-- index.js                        # Root API router
|   |-- utils/
|   |   `-- response.js                     # Standardizer format respons JSON (Success/Error)
|   |-- app.js                              # Inisialisasi Express & konfigurasi CORS
|   `-- server.js                           # Entry point server & graceful shutdown
|-- uploads/                                # Direktori penyimpanan file gambar pakaian
|   `-- .gitkeep
|-- .env.example                            # Template variabel environment
|-- .gitignore
|-- drizzle.config.js                       # Konfigurasi Drizzle Kit
|-- package.json
`-- README.md
```

---

## Panduan Memulai (Getting Started)

### 1. Prasyarat
- Node.js (v18 atau lebih baru)
- PostgreSQL (Lokal atau melalui Docker container)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi database PostgreSQL dan port (default: `5001`):
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://looka:looka123@localhost:5432/looka_db
JWT_SECRET=supersecretjwtkey_looka_2026_ksm_multimedia
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Server akan aktif di: `http://localhost:5001`  
Uji kesehatan sistem di browser: `http://localhost:5001/api/health`

---

## Manajemen Basis Data (Drizzle ORM)
- **Push Skema ke PostgreSQL:**
  ```bash
  npm run db:push
  ```
- **Buka GUI Visual Database (Drizzle Studio):**
  ```bash
  npm run db:studio
  ```

---

## Dokumentasi API (Postman Collection)
File kontrak API siap pakai tersedia di:
Folder `postman/Looka_API.postman_collection.json`

Impor file tersebut ke aplikasi **Postman** untuk menguji endpoint yang tersedia.