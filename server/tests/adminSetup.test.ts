import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Integration tests: a real throwaway SQLite database, built from the real migrations.
process.env.DATABASE_URL = 'file:./admin-setup-test.db';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

const { prisma } = await import('../src/lib/prisma.js');
const { createAdminIfMissing, MIN_ADMIN_PASSWORD_LENGTH } = await import('../src/services/adminSetup.js');

const PASSWORD = 'a-long-enough-password';

beforeAll(() => {
  execSync('npx prisma migrate deploy', { stdio: 'pipe' });
}, 60_000);

beforeEach(async () => {
  await prisma.admin.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  for (const file of ['admin-setup-test.db', 'admin-setup-test.db-journal']) rmSync(`prisma/${file}`, { force: true });
});

describe('createAdminIfMissing', () => {
  it('creates the admin, with a hashed password and a tidy email', async () => {
    const result = await createAdminIfMissing({ email: '  Boss@Example.com ', password: PASSWORD, name: ' Boss ' });
    expect(result).toBe('created');

    const admin = (await prisma.admin.findMany())[0]!;
    expect(admin.email).toBe('boss@example.com');
    expect(admin.name).toBe('Boss');
    expect(admin.passwordHash).not.toContain(PASSWORD);
    expect(await bcrypt.compare(PASSWORD, admin.passwordHash)).toBe(true);
  });

  it('uses the name "Admin" when none is given', async () => {
    await createAdminIfMissing({ email: 'boss@example.com', password: PASSWORD });
    expect((await prisma.admin.findMany())[0]!.name).toBe('Admin');
  });

  it('never changes an account that exists, so a restart cannot reset a password', async () => {
    await createAdminIfMissing({ email: 'boss@example.com', password: PASSWORD });
    const result = await createAdminIfMissing({ email: 'BOSS@example.com', password: 'a-different-long-password' });

    expect(result).toBe('already-exists');
    const admins = await prisma.admin.findMany();
    expect(admins).toHaveLength(1);
    expect(await bcrypt.compare(PASSWORD, admins[0]!.passwordHash)).toBe(true);
  });

  it('does nothing when the email or the password is missing', async () => {
    expect(await createAdminIfMissing({})).toBe('skipped');
    expect(await createAdminIfMissing({ email: 'boss@example.com' })).toBe('skipped');
    expect(await createAdminIfMissing({ password: PASSWORD })).toBe('skipped');
    expect(await createAdminIfMissing({ email: '  ', password: PASSWORD })).toBe('skipped');
    expect(await prisma.admin.count()).toBe(0);
  });

  it('refuses a short password, and an email that is not one', async () => {
    await expect(createAdminIfMissing({ email: 'boss@example.com', password: 'x'.repeat(MIN_ADMIN_PASSWORD_LENGTH - 1) })).rejects.toThrow(
      /at least 12 characters/,
    );
    await expect(createAdminIfMissing({ email: 'not-an-email', password: PASSWORD })).rejects.toThrow(/valid email/);
    expect(await prisma.admin.count()).toBe(0);
  });
});
