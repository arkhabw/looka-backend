import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { errorResponse } from '../utils/response.js';

// Ensure uploads directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `clothing-${uniqueSuffix}${ext}`);
  },
});

// 2. File Filter (Only JPG, PNG, WEBP)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap unggah foto dengan format JPG, PNG, atau WEBP.'), false);
  }
};

// 3. Multer Instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
}).single('image');

// 4. Wrapper Middleware with Clean Error Handling
export const uploadClothingImage = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return errorResponse(res, {
          statusCode: 400,
          message: 'Ukuran file foto terlalu besar. Maksimal ukuran file adalah 5 MB.',
        });
      }
      return errorResponse(res, {
        statusCode: 400,
        message: `Terjadi kesalahan saat upload gambar: ${err.message}`,
      });
    } else if (err) {
      return errorResponse(res, {
        statusCode: 400,
        message: err.message,
      });
    }
    next();
  });
};