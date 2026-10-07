import type { RequestHandler } from 'express';
import * as authService from '../services/authService.js';
import type { LoginInput } from '../validators/auth.js';

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as LoginInput;
  const result = await authService.login(email, password);
  res.json({ data: result });
};

export const me: RequestHandler = async (_req, res) => {
  const admin = await authService.getAdminById(res.locals.adminId);
  res.json({ data: admin });
};
