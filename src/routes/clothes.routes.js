import { Router } from 'express';
import {
  createClothing,
  getClothes,
  getClothingById,
  updateClothing,
  deleteClothing,
  getFilterMetadata,
} from '../controllers/clothes.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadClothingImage } from '../middlewares/upload.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createClothingSchema, updateClothingSchema } from '../validations/clothes.validation.js';

const router = Router();

// All clothes endpoints require authentication
router.use(authenticateToken);

// 1. Metadata for dynamic filter dropdowns
router.get('/meta/filters', getFilterMetadata);

// 2. Collection routes
router.get('/', getClothes);
router.post('/', uploadClothingImage, validateBody(createClothingSchema), createClothing);

// 3. Item routes
router.get('/:id', getClothingById);
router.put('/:id', uploadClothingImage, validateBody(updateClothingSchema), updateClothing);
router.delete('/:id', deleteClothing);

export default router;