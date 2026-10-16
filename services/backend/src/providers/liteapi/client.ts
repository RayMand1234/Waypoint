import { err, ok } from '@waypoint/contracts/common';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import type { ProviderFailure, ProviderResult } from '../types.ts';

export type QueryValue = string | number | boolean | undefined;

export type LiteApiClient = {
  readonly get: <Schema extends z.ZodType>(
    path: string,
    query: Readonly<Record<string, QueryValue>>,
    schema: Schema,
  ) => ProviderResult<z.output<Schema>>;
  readonly post: <Schema extends z.ZodType>(
    path: string,
    body: unknown,
    schema: Schema,
    /** Carries the call's own deadline; without it the client's default applies. */
    signal?: AbortSignal,
  ) => ProviderResult<z.output<Schema>>;
};

/** liteAPI's error body: `{ "error": { "code": 2001, "message": "…" } }`. */
const errorBodySchema = z.object({
  error: z.object({
    message: z.string().optional(),
    description: z.string().optional(),
  }),
});

const describeError = (body: unknown, status: number): string => {
  const parsed = errorBodySchema.safeParse(body);

  return parsed.success
    ? (parsed.data.error.message ??
        parsed.data.error.description ??
        `HTTP ${String(status)}`)
    : `HTTP ${String(status)}`;
};

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === 'TimeoutError' || error.name === 'AbortError');

/** The body as JSON, or `NOT_JSON` (e.g. an HTML error page from a proxy). */
const NOT_JSON = Symbol('not-json');

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return NOT_JSON;
  }
};

const toUrl = (
  baseUrl: string,
  path: string,
  query: Readonly<Record<string, QueryValue>>,
): URL => {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  return url;
};

/**
 * The only code that talks HTTP to liteAPI. Every call has a timeout, and
 * every response is Zod-parsed — never cast — into the adapter's raw schema.
 * Failures come back as a `ProviderFailure`, never as a throw.
 */
export const createLiteApiClient = ({
  apiKey,
  baseUrl,
  timeoutMs,
  fetch,
}: {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly fetch: TracedFetch;
}): LiteApiClient => {
  const send = async <Schema extends z.ZodType>(
    url: URL,
    init: RequestInit,
    schema: Schema,
    signal: AbortSignal | undefined,
  ): ProviderResult<z.output<Schema>> => {
    const headers = { accept: 'application/json', 'x-api-key': apiKey };

    try {
      const response = await fetch(url, {
        ...init,
        headers:
          init.body === undefined
            ? headers
            : { ...headers, 'content-type': 'application/json' },
        // A caller's own signal carries its deadline (live searches set one
        // per kind — flights take longer than hotels); otherwise the default.
        signal: signal ?? AbortSignal.timeout(timeoutMs),
      });
      const body = await readJson(response);

      if (response.status === 404)
        return err<ProviderFailure>({ type: 'not-found' });

      if (!response.ok) {
        return err<ProviderFailure>({
          type: 'unavailable',
          status: response.status,
          message: describeError(body, response.status),
        });
      }

      if (body === NOT_JSON) {
        return err<ProviderFailure>({
          type: 'invalid-response',
          message: 'body is not JSON',
        });
      }

      const parsed = schema.safeParse(body);

      if (!parsed.success) {
        const issue = parsed.error.issues[0];

        return err<ProviderFailure>({
          type: 'invalid-response',
          message:
            issue === undefined
              ? 'unparseable'
              : `${issue.path.join('.')}: ${issue.message}`,
        });
      }

      return ok(parsed.data);
    } catch (error) {
      return isAbort(error)
        ? err<ProviderFailure>({ type: 'timeout' })
        : err<ProviderFailure>({
            type: 'unavailable',
            status: null,
            message: error instanceof Error ? error.message : String(error),
          });
    }
  };

  return {
    get: (path, query, schema) =>
      send(toUrl(baseUrl, path, query), { method: 'GET' }, schema, undefined),
    post: (path, body, schema, signal) =>
      send(
        toUrl(baseUrl, path, {}),
        { method: 'POST', body: JSON.stringify(body) },
        schema,
        signal,
      ),
  };
};
