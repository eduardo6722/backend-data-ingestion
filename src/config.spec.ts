import { validateEnv } from './config';

describe('config', () => {
  it('applies development defaults', () => {
    const env = validateEnv({ NODE_ENV: 'development' });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(8080);
    expect(env.LOG_LEVEL).toBe('debug');
    expect(env.DATABASE_URL).toBe(
      'postgresql://prisma:prisma@localhost:5432/makes?schema=public',
    );
    expect(env.REDIS_URL).toBe('redis://localhost:6379');
    expect(env.VPIC_BASE_URL).toBe('https://vpic.nhtsa.dot.gov');
    expect(env.MAKES_CACHE_TTL_SECONDS).toBe(300);
  });

  it('applies test defaults', () => {
    const env = validateEnv({ NODE_ENV: 'test' });

    expect(env.LOG_LEVEL).toBe('silent');
    expect(env.DATABASE_URL).toContain('localhost');
    expect(env.REDIS_URL).toContain('localhost');
  });

  it('requires database and redis urls in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /DATABASE_URL|REDIS_URL/,
    );
  });

  it('accepts a valid production config', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db:5432/makes',
      REDIS_URL: 'redis://redis:6379',
    });

    expect(env.LOG_LEVEL).toBe('info');
    expect(env.PORT).toBe(8080);
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@db:5432/makes');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'development', PORT: 'not-a-port' }),
    ).toThrow('Invalid configuration');
  });

  it('rejects an unknown environment', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(
      'Invalid configuration',
    );
  });
});
