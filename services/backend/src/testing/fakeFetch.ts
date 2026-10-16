import type { TracedFetch } from '../observability/tracedFetch.ts';

export type RecordedCall = {
  readonly url: URL;
  readonly init: RequestInit;
  /** The JSON body that was sent, parsed; `undefined` for a GET. */
  readonly body: unknown;
};

/**
 * A `fetch` that answers from a handler instead of the network, and records
 * every call so a test can check what an adapter sent.
 */
export const fakeFetch = (
  handler: (
    url: URL,
    init: RequestInit,
  ) => { readonly status?: number; readonly body: unknown },
): { readonly fetch: TracedFetch; readonly calls: RecordedCall[] } => {
  const calls: RecordedCall[] = [];

  return {
    calls,
    fetch: (url, init) => {
      calls.push({
        url,
        init,
        body:
          typeof init.body === 'string'
            ? (JSON.parse(init.body) as unknown)
            : undefined,
      });

      const { status = 200, body } = handler(url, init);

      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
      );
    },
  };
};
