import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POSTGRES_HEADER, toPostgresSchema } from '../prisma/postgresSchema.js';

const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

describe('the PostgreSQL schema used in production', () => {
  it('differs from the SQLite schema only in the database type', () => {
    const sqlite = read('prisma/schema.prisma');
    const postgres = toPostgresSchema(sqlite);
    expect(postgres.startsWith(POSTGRES_HEADER)).toBe(true);
    expect(postgres.replace(POSTGRES_HEADER, '').replace('provider = "postgresql"', 'provider = "sqlite"')).toBe(sqlite);
  });

  it('is up to date: run `npm run db:pg-schema` after changing schema.prisma', () => {
    expect(read('prisma/postgres/schema.prisma')).toBe(toPostgresSchema(read('prisma/schema.prisma')));
  });

  it('refuses a schema that is not SQLite, so a half-changed file is noticed', () => {
    expect(() => toPostgresSchema('datasource db { provider = "postgresql" }')).toThrow(/sqlite/);
  });

  it('has migrations written for PostgreSQL, not SQLite', () => {
    expect(read('prisma/postgres/migrations/migration_lock.toml')).toContain('provider = "postgresql"');
    const sql = read('prisma/postgres/migrations/20261008000000_init/migration.sql');
    expect(sql).toContain('CREATE TYPE "TaskStatus" AS ENUM');
    expect(sql).toContain('SERIAL');
    expect(sql).not.toContain('AUTOINCREMENT');
    expect(sql).not.toMatch(/^warn|Update available/m); // no tool output mixed into the file
  });

  it('has a table and a foreign key for every model in the schema', () => {
    const models = [...read('prisma/schema.prisma').matchAll(/^model (\w+) /gm)].map((m) => m[1]);
    const sql = read('prisma/postgres/migrations/20261008000000_init/migration.sql');
    for (const model of models) expect(sql).toContain(`CREATE TABLE "${model}"`);
    expect(sql).toContain('ON DELETE SET NULL'); // deleting an employee unassigns their tasks
  });
});
