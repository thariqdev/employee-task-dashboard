/**
 * Creates the first admin from ADMIN_EMAIL, ADMIN_PASSWORD and (optionally) ADMIN_NAME.
 * Run on every production start: it does nothing once the account exists, or when the variables are not set.
 * To replace the password of an account that exists, set ADMIN_RESET=true for one start, then remove it.
 */
import { prisma } from '../lib/prisma.js';
import { createAdminIfMissing } from '../services/adminSetup.js';

try {
  const result = await createAdminIfMissing({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME,
    resetPassword: process.env.ADMIN_RESET === 'true',
  });
  const messages = {
    created: 'Created the admin account.',
    'already-exists': 'The admin account already exists. Left as it is.',
    'password-reset': 'The admin password was reset. Remove ADMIN_RESET now, or every restart will reset it again.',
    skipped: 'ADMIN_EMAIL and ADMIN_PASSWORD are not set. No admin account was created.',
  };
  console.log(messages[result]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
