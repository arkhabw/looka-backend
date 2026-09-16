import { Router } from 'express';
import { getUserAnalytics } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All user analytics endpoints require authentication
router.use(authenticateToken);

// Wardrobe utilization metrics and insights
router.get('/analytics', getUserAnalytics);

export default router;
