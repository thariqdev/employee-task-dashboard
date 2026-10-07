import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-123';

const { createApp } = await import('../src/app.js');
const { errorHandler } = await import('../src/middleware/errorHandler.js');
const { validate } = await import('../src/middleware/validate.js');

describe('app basics', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('unknown route returns a JSON 404', async () => {
    const res = await request(createApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('Route not found');
  });

  it('malformed JSON returns 400', async () => {
    const res = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Invalid JSON in request body');
  });
});

describe('security headers and CORS', () => {
  const app = createApp();

  it('sets helmet headers and hides X-Powered-By', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('allows the configured client origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not allow other origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('validate middleware', () => {
  const app = express();
  app.use(express.json());
  app.post('/echo', validate(z.object({ name: z.string().min(2) })), (req, res) => {
    res.json({ data: req.body });
  });
  app.get('/q', validate(z.object({ page: z.coerce.number().int() }), 'query'), (_req, res) => {
    res.json({ data: res.locals.query });
  });
  app.get('/boom', () => {
    throw new Error('secret internals');
  });
  app.use(errorHandler);

  it('passes valid body through', async () => {
    const res = await request(app).post('/echo').send({ name: 'Aria' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ name: 'Aria' });
  });

  it('rejects invalid body with field details', async () => {
    const res = await request(app).post('/echo').send({ name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('name');
  });

  it('coerces query values', async () => {
    const res = await request(app).get('/q?page=3');
    expect(res.body.data).toEqual({ page: 3 });
  });

  it('hides unexpected error messages', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Internal server error');
  });
});
