import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export type AdminSetupInput = { email?: string; password?: string; name?: string };
export type AdminSetupResult = 'created' | 'already-exists' | 'skipped';

/**
 * Makes the first admin account on a fresh (for example, newly deployed) database.
 * It only ever creates: an account that already exists is left alone, so a restart never resets a password.
 * Does nothing when no email and password are given.
 */
export async function createAdminIfMissing({ email, password, name }: AdminSetupInput): Promise<AdminSetupResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !password) return 'skipped';

  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('ADMIN_EMAIL is not a valid email address.');
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
  }

  if (await prisma.admin.findUnique({ where: { email: cleanEmail } })) return 'already-exists';

  await prisma.admin.create({
    data: { name: name?.trim() || 'Admin', email: cleanEmail, passwordHash: await bcrypt.hash(password, 10) },
  });
  return 'created';
}
