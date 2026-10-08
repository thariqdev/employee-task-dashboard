import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export type AdminSetupInput = {
  email?: string;
  password?: string;
  name?: string;
  /** Also change the password of an admin that already exists (use once, to recover or replace a password). */
  resetPassword?: boolean;
};
export type AdminSetupResult = 'created' | 'already-exists' | 'password-reset' | 'skipped';

/**
 * Makes the first admin account on a fresh (for example, newly deployed) database.
 * An account that already exists is left alone, so a restart never resets a password,
 * unless `resetPassword` is asked for. Does nothing when no email and password are given.
 */
export async function createAdminIfMissing({
  email,
  password,
  name,
  resetPassword = false,
}: AdminSetupInput): Promise<AdminSetupResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !password) return 'skipped';
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('ADMIN_EMAIL is not a valid email address.');

  const existing = await prisma.admin.findUnique({ where: { email: cleanEmail } });
  // The password is only looked at when it will be used, so a short one cannot block a start that needs no account.
  if (existing && !resetPassword) return 'already-exists';

  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
  }
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    await prisma.admin.update({
      where: { id: existing.id },
      data: { passwordHash, ...(name?.trim() ? { name: name.trim() } : {}) },
    });
    return 'password-reset';
  }

  await prisma.admin.create({ data: { name: name?.trim() || 'Admin', email: cleanEmail, passwordHash } });
  return 'created';
}
