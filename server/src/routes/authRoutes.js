import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/logout', authenticate, logout);
router.post('/refresh', refreshLimiter, refreshToken);
router.get('/me', authenticate, getMe);

export default router;
