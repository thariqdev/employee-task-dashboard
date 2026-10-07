import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';

export type AuthTokenPayload = { sub: string; email: string };

// Compared against when the email is unknown, so "no such user" takes as long as
// "wrong password" and response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export async function login(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  const passwordOk = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !passwordOk) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const payload: AuthTokenPayload = { sub: String(admin.id), email: admin.email };
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  });

  return { token, admin: { id: admin.id, name: admin.name, email: admin.email } };
}

/** Returns the token payload, or throws a 401 if it is invalid or expired. */
export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw new Error('Unexpected token payload');
    }
    return { sub: decoded.sub, email: decoded.email as string };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}

export async function getAdminById(id: number) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });
  if (!admin) throw new HttpError(401, 'Account no longer exists');
  return admin;
}
