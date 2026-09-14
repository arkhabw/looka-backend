import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validations/auth.validation.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Routes
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

// Private Routes (Protected by JWT)
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);

export default router;