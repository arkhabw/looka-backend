import { Router } from 'express';
import { createClothing, getClothes, getClothingById } from '../controllers/clothes.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadClothingImage } from '../middlewares/upload.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createClothingSchema } from '../validations/clothes.validation.js';

const router = Router();

// All clothes endpoints require authentication
router.use(authenticateToken);

// Routes
router.post('/', uploadClothingImage, validateBody(createClothingSchema), createClothing);
router.get('/', getClothes);
router.get('/:id', getClothingById);

export default router;