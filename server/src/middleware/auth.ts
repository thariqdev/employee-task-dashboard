import type { RequestHandler } from 'express';
import { HttpError } from '../lib/httpError.js';
import { verifyToken } from '../services/authService.js';

/** Requires "Authorization: Bearer <token>". Stores the admin id in res.locals.adminId. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authentication required'));
  }

  try {
    res.locals.adminId = Number(verifyToken(token).sub);
    next();
  } catch (err) {
    next(err);
  }
};
