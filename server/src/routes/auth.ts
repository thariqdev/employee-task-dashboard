import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/auth.js';

export function authRoutes() {
  const router = Router();

  // Slows down password guessing: 10 login attempts per 15 minutes per IP.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { message: 'Too many login attempts, try again later' } },
  });

  router.post('/login', loginLimiter, validate(loginSchema), authController.login);
  router.get('/me', requireAuth, authController.me);

  return router;
}
