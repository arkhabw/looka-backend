import { Router } from 'express';
import {
  createOutfit,
  getOutfits,
  getOutfitById,
  updateOutfit,
  deleteOutfit,
  logOutfitWear,
  getWearCalendar,
  deleteWearLog,
} from '../controllers/outfit.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  createOutfitSchema,
  updateOutfitSchema,
  logWearSchema,
} from '../validations/outfit.validation.js';

const router = Router();

// All outfit endpoints require authentication
router.use(authenticateToken);

// 1. Calendar & Wear Tracker routes (Registered before /:id parameter)
router.post('/wear-today', validateBody(logWearSchema), logOutfitWear);
router.get('/calendar', getWearCalendar);
router.delete('/calendar/:logId', deleteWearLog);

// 2. Outfit Collection routes
router.get('/', getOutfits);
router.post('/', validateBody(createOutfitSchema), createOutfit);

// 3. Single Outfit Item routes
router.get('/:id', getOutfitById);
router.put('/:id', validateBody(updateOutfitSchema), updateOutfit);
router.delete('/:id', deleteOutfit);

export default router;
