import { errorResponse } from '../utils/response.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const formattedErrors = err.errors.map((e) => ({
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