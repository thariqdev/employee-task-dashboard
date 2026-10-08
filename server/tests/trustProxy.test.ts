import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

// Set before the app is loaded, because the setting is read once at start-up.
process.env.DATABASE_URL = 'file:./trust-proxy-test.db';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.TRUST_PROXY = '1';

// No real database: every email is unknown, so a login attempt is simply refused with 401.
vi.mock('../src/lib/prisma.js', () => ({ prisma: { admin: { findUnique: async () => null } } }));

const { createApp } = await import('../src/app.js');

describe('behind a hosting proxy (TRUST_PROXY=1)', () => {
  it('tells Express to trust one proxy', () => {
    expect(createApp().get('trust proxy')).toBe(1);
  });

  it('counts login attempts per visitor, using the IP the proxy forwards, not per proxy', async () => {
    const app = createApp();
    const attempt = (ip: string) =>
      request(app).post('/api/auth/login').set('X-Forwarded-For', ip).send({ email: 'a@example.com', password: 'wrong' });

    for (let i = 0; i < 10; i++) expect((await attempt('203.0.113.7')).status).toBe(401);
    expect((await attempt('203.0.113.7')).status).toBe(429); // this visitor is out of attempts...
    expect((await attempt('198.51.100.9')).status).toBe(401); // ...but another visitor is not affected
  });
});
