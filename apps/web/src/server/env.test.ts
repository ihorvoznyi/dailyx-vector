import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('leaves every field undefined for an empty env', () => {
    const env = parseEnv({});
    expect(env.APP_ENV).toBeUndefined();
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.BETTER_AUTH_SECRET).toBeUndefined();
    expect(env.ALLOWED_EMAIL).toBeUndefined();
  });

  it('treats an empty string as unset', () => {
    expect(parseEnv({ GOOGLE_CLIENT_ID: '' }).GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it('requires the production set and names the missing keys', () => {
    expect(() => parseEnv({ APP_ENV: 'production' })).toThrowError(/DATABASE_URL/);
    expect(() => parseEnv({ APP_ENV: 'production' })).toThrowError(/ALLOWED_EMAIL/);
  });

  it('rejects a malformed allowed email', () => {
    expect(() => parseEnv({ ALLOWED_EMAIL: 'not-an-email' })).toThrow();
  });

  it('rejects a short auth secret', () => {
    expect(() => parseEnv({ BETTER_AUTH_SECRET: 'short' })).toThrow();
  });

  it('parses a full production set', () => {
    expect(() =>
      parseEnv({
        APP_ENV: 'production',
        DATABASE_URL: 'postgres://x',
        BETTER_AUTH_SECRET: 'x'.repeat(40),
        BETTER_AUTH_URL: 'https://vector.example.com',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        ALLOWED_EMAIL: 'owner@example.com',
      }),
    ).not.toThrow();
  });
});
