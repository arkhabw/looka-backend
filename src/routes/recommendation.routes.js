import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendation.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { recommendationSchema } from '../validations/recommendation.validation.js';

const router = Router();

// All recommendation endpoints require authentication
router.use(authenticateToken);

// Generate outfit recommendations (supports POST with JSON body and GET with query parameters)
router.post('/', validateBody(recommendationSchema), getRecommendations);
router.get('/', getRecommendations);

export default router;
