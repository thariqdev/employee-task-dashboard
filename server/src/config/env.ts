import { z } from 'zod';

/** Reads and validates environment variables once at startup. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // How many proxies sit in front of the server (Render and similar hosts: 1). Needed to see the real visitor IP.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  trustProxy: parsed.data.TRUST_PROXY,
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
} as const;
