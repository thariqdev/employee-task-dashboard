import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-123';

const admin = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  passwordHash: bcrypt.hashSync('Admin@12345', 4),
};

// No real database: the Prisma client is replaced with a tiny fake.
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    admin: {
      findUnique: async ({ where }: { where: { email?: string; id?: number } }) =>
        where.email === admin.email || where.id === admin.id ? admin : null,
    },
  },
}));

const { createApp } = await import('../src/app.js');

describe('auth', () => {
  const app = createApp();
  const login = (body: object) => request(app).post('/api/auth/login').send(body);

  it('logs in with correct credentials and returns a token (no password hash)', async () => {
    const res = await login({ email: ' ADMIN@example.com ', password: 'Admin@12345' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.admin).toEqual({ id: 1, name: 'Admin', email: 'admin@example.com' });
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    const wrongPassword = await login({ email: admin.email, password: 'nope' });
    const unknownEmail = await login({ email: 'who@example.com', password: 'nope' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it('rejects an invalid body with 400', async () => {
    const res = await login({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('GET /me needs a valid token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer junk')).status).toBe(401);

    const expired = jwt.sign({ sub: '1' }, process.env.JWT_SECRET!, { expiresIn: -10 });
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)).status).toBe(401);

    const { body } = await login({ email: admin.email, password: 'Admin@12345' });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(admin.email);
  });

  it('rejects a token signed with the wrong secret, and a non-Bearer scheme', async () => {
    const forged = jwt.sign({ sub: '1' }, 'some-other-secret-some-other-secret-1234');
    const wrongSecret = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(wrongSecret.status).toBe(401);

    const valid = jwt.sign({ sub: '1' }, process.env.JWT_SECRET!);
    const basic = await request(app).get('/api/auth/me').set('Authorization', `Basic ${valid}`);
    expect(basic.status).toBe(401);
  });

  it('rejects a valid token whose admin no longer exists', async () => {
    const token = jwt.sign({ sub: '999' }, process.env.JWT_SECRET!);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Account no longer exists');
  });

  it('rate limits login: the 11th attempt in a row gets 429', async () => {
    const limitedApp = createApp(); // fresh app, so a fresh attempt counter
    const attempt = () => request(limitedApp).post('/api/auth/login').send({ email: admin.email, password: 'wrong' });

    for (let i = 0; i < 10; i++) {
      expect((await attempt()).status).toBe(401);
    }
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toBe('Too many login attempts, try again later');
  });
});
