/** Writes prisma/postgres/schema.prisma from prisma/schema.prisma. Run with `npm run db:pg-schema`. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPostgresSchema } from './postgresSchema.js';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, 'postgres', 'schema.prisma');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, toPostgresSchema(readFileSync(join(here, 'schema.prisma'), 'utf8')));
console.log('Wrote prisma/postgres/schema.prisma');
