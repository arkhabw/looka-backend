import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Mount Health Check endpoint
router.use('/health', healthRoutes);

// Ready placeholders for subsequent Day sprints:
// router.use('/auth', authRoutes);
// router.use('/clothes', clothesRoutes);
// router.use('/recommendations', recommendationRoutes);
// router.use('/outfits', outfitRoutes);
// router.use('/users', userRoutes);

export default router;