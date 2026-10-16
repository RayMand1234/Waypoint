import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import { fakeFetch } from '../../testing/index.ts';
import { createLiteApiClient } from './client.ts';

const schema = z.object({ data: z.array(z.object({ code: z.string() })) });

const clientWith = (fetch: TracedFetch, timeoutMs = 1000) =>
  createLiteApiClient({
    apiKey: 'k',
    baseUrl: 'https://api.test/v3.0/',
    timeoutMs,
    fetch,
  });

describe('liteAPI client', () => {
  it('parses a good response and leaves out undefined query values', async () => {
    const { fetch, calls } = fakeFetch(() => ({
      body: { data: [{ code: 'PT' }] },
    }));

    const result = await clientWith(fetch).get(
      '/data/countries',
      { a: 'x', b: undefined },
      schema,
    );

    expect(result).toEqual({ ok: true, value: { data: [{ code: 'PT' }] } });
    expect(calls[0]?.url.toString()).toBe(
      'https://api.test/v3.0/data/countries?a=x',
    );
  });

  it('maps 404 to not-found and other errors to unavailable with liteAPI’s message', async () => {
    const notFound = fakeFetch(() => ({ status: 404, body: {} }));
    const failing = fakeFetch(() => ({
      status: 401,
      body: { error: { code: 4010, message: 'bad key' } },
    }));

    expect(await clientWith(notFound.fetch).get('/x', {}, schema)).toEqual({
      ok: false,
      error: { type: 'not-found' },
    });
    expect(await clientWith(failing.fetch).get('/x', {}, schema)).toEqual({
      ok: false,
      error: { type: 'unavailable', status: 401, message: 'bad key' },
    });
  });

  it('reports a response it cannot read as invalid-response, never a throw', async () => {
    const { fetch } = fakeFetch(() => ({ body: { data: [{ code: 7 }] } }));

    const result = await clientWith(fetch).get('/x', {}, schema);

    expect(result.ok ? null : result.error.type).toBe('invalid-response');
  });

  it('times out instead of waiting forever', async () => {
    const hanging: TracedFetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          reject(
            init.signal?.reason instanceof Error
              ? init.signal.reason
              : new Error('aborted'),
          );
        });
      });

    expect(await clientWith(hanging, 20).get('/x', {}, schema)).toEqual({
      ok: false,
      error: { type: 'timeout' },
    });
  });

  it('turns a network failure into unavailable', async () => {
    const offline: TracedFetch = () =>
      Promise.reject(new TypeError('fetch failed'));

    expect(await clientWith(offline).get('/x', {}, schema)).toEqual({
      ok: false,
      error: { type: 'unavailable', status: null, message: 'fetch failed' },
    });
  });
});
