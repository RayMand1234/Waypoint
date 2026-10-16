import { describe, expect, it } from 'vitest';
import { parseEnv } from './env.ts';

const base = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  LITEAPI_KEY: 'sandbox-key',
};

describe('parseEnv', () => {
  it('lets development run without a white-label site (empty counts as unset)', () => {
    expect(parseEnv(base).LITEAPI_WHITELABEL_URL).toBeUndefined();
    expect(
      parseEnv({ ...base, LITEAPI_WHITELABEL_URL: '' }).LITEAPI_WHITELABEL_URL,
    ).toBeUndefined();
  });

  it('requires the white-label site in production', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'production' })).toThrow(
      /LITEAPI_WHITELABEL_URL/,
    );
    expect(
      parseEnv({
        ...base,
        NODE_ENV: 'production',
        LITEAPI_WHITELABEL_URL: 'https://book.example',
      }).LITEAPI_WHITELABEL_URL,
    ).toBe('https://book.example');
  });

  it('still refuses a value that is not a URL', () => {
    expect(() =>
      parseEnv({ ...base, LITEAPI_WHITELABEL_URL: 'not a url' }),
    ).toThrow(/LITEAPI_WHITELABEL_URL/);
  });
});
