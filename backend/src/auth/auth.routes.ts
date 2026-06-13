import { Router } from 'express';
import { register, login, googleLogin, updateProfile, getProfile } from './authController.js';
import { authMiddleware } from '../shared/middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.put('/profile', authMiddleware, updateProfile);
router.get('/profile', authMiddleware, getProfile);

export default router;
