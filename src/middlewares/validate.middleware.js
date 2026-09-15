import fs from 'fs';
import { errorResponse } from '../utils/response.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    // If a file was uploaded prior to validation failure, remove it to prevent orphaned files
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('[UPLOAD] Error removing invalid uploaded file:', unlinkErr.message);
      }
    }

    if (err.name === 'ZodError') {
      const issues = err.issues || err.errors || [];
      const formattedErrors = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return errorResponse(res, {
        statusCode: 400,
        message: 'Validasi data gagal. Periksa kembali input Anda.',
        errors: formattedErrors,
      });
    }
    next(err);
  }
};