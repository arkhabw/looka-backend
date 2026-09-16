import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import clothesRoutes from './clothes.routes.js';
import recommendationRoutes from './recommendation.routes.js';

const router = Router();

// Mount Health Check endpoint
router.use('/health', healthRoutes);

// Mount Authentication endpoints
router.use('/auth', authRoutes);

// Mount Clothes / Wardrobe endpoints
router.use('/clothes', clothesRoutes);

// Mount Outfit Recommendation endpoints
router.use('/recommendations', recommendationRoutes);

// Ready placeholders for subsequent Day sprints:
// router.use('/outfits', outfitRoutes);
// router.use('/users', userRoutes);

export default router;