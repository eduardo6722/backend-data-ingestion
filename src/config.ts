import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv({ path: '.env' });

const logLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const;

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  LOG_LEVEL: z.enum(logLevels).default('info'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  VPIC_BASE_URL: z.url().default('https://vpic.nhtsa.dot.gov'),
  MAKES_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
});

export type Env = z.infer<typeof envSchema>;

function withDefaults(config: Record<string, unknown>) {
  const env =
    typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development';
  const isProd = env === 'production';

  return {
    ...config,
    NODE_ENV: env,
    LOG_LEVEL:
      config.LOG_LEVEL ??
      (isProd ? 'info' : env === 'test' ? 'silent' : 'debug'),
    DATABASE_URL:
      config.DATABASE_URL ??
      (isProd
        ? undefined
        : 'postgresql://prisma:prisma@localhost:5432/makes?schema=public'),
    REDIS_URL:
      config.REDIS_URL ?? (isProd ? undefined : 'redis://localhost:6379'),
  };
}

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(withDefaults(config));

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid configuration: ${details}`);
  }

  return parsed.data;
}
