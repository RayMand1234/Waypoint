import type { Logger } from './logger.ts';
import { serializeError } from './serializeError.ts';

export type TracedFetch = (url: URL, init: RequestInit) => Promise<Response>;

/**
 * `fetch` that logs every outbound call — upstream, method, path, status and
 * duration — under the current request's id. Only the path is logged: query
 * strings and bodies can hold search text or keys.
 */
export const createTracedFetch =
  ({
    logger,
    upstream,
    fetchImpl = fetch,
  }: {
    readonly logger: Logger;
    readonly upstream: string;
    readonly fetchImpl?: typeof fetch;
  }): TracedFetch =>
  async (url, init) => {
    const started = performance.now();
    const call = { upstream, method: init.method ?? 'GET', path: url.pathname };
    const elapsed = (): number => Math.round(performance.now() - started);

    try {
      const response = await fetchImpl(url, init);

      logger.log(response.ok ? 'info' : 'warn', 'upstream call', {
        ...call,
        status: response.status,
        durationMs: elapsed(),
      });

      return response;
    } catch (error) {
      logger.warn('upstream call failed', {
        ...call,
        durationMs: elapsed(),
        error: serializeError(error),
      });
      throw error;
    }
  };
