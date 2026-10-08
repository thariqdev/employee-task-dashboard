/**
 * Creates the first admin from ADMIN_EMAIL, ADMIN_PASSWORD and (optionally) ADMIN_NAME.
 * Run on every production start: it does nothing once the account exists, or when the variables are not set.
 */
import { prisma } from '../lib/prisma.js';
import { createAdminIfMissing } from '../services/adminSetup.js';

try {
  const result = await createAdminIfMissing({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME,
  });
  const messages = {
    created: 'Created the admin account.',
    'already-exists': 'The admin account already exists. Left as it is.',
    skipped: 'ADMIN_EMAIL and ADMIN_PASSWORD are not set. No admin account was created.',
  };
  console.log(messages[result]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
