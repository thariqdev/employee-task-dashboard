import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'file:./test.db';
process.env.JWT_SECRET ??= 'test-secret-test-secret-test-secret-123';

const { createApp } = await import('../src/app.js');
const { openApiSpec } = await import('../src/docs/openapi.js');

describe('API docs', () => {
  it('the OpenAPI spec is valid', async () => {
    // validate() also resolves every $ref, so a typo in a schema name fails here.
    const api = await SwaggerParser.validate(structuredClone(openApiSpec) as never);
    expect(api.info.title).toBe('TaskDesk API');
  });

  it('documents every route', () => {
    expect(Object.keys(openApiSpec.paths)).toEqual([
      '/health',
      '/auth/login',
      '/auth/me',
      '/employees',
      '/employees/{id}',
      '/tasks',
      '/tasks/{id}',
    ]);
  });

  it('serves the spec as JSON, with no login needed', async () => {
    const res = await request(createApp()).get('/api/docs/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
  });

  it('serves the Swagger UI page, with no login needed', async () => {
    const res = await request(createApp()).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
