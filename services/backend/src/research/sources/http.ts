import { err, ok, type Result } from '@waypoint/contracts/common';
import type { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';

/** Wikimedia and Overpass ask every client to identify itself. */
export const USER_AGENT =
  'Waypoint-research/0.1 (https://waypoint.app; research@waypoint.app)';

/** The open sources research reads. */
export type ResearchSource =
  'wikidata' | 'openstreetmap' | 'wikipedia' | 'wikimedia-commons';

export type SourceFailure = {
  readonly source: ResearchSource;
  readonly message: string;
  /** The HTTP status when the source answered with an error; `null` when it didn't answer or sent nonsense. */
  readonly status: number | null;
};

export type FetchJsonRequest<Schema extends z.ZodType> = {
  readonly fetch: TracedFetch;
  readonly source: ResearchSource;
  readonly url: URL;
  readonly init?: Omit<RequestInit, 'headers'> & {
    readonly headers?: Readonly<Record<string, string>>;
  };
  readonly schema: Schema;
  readonly timeoutMs: number;
};

/** Fetches JSON and parses it with `schema`. Research is offline, so a failure is reported, not retried. */
export const fetchJson = async <Schema extends z.ZodType>({
  fetch,
  source,
  url,
  init = {},
  schema,
  timeoutMs,
}: FetchJsonRequest<Schema>): Promise<
  Result<z.output<Schema>, SourceFailure>
> => {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok)
      return err({
        source,
        message: `HTTP ${String(response.status)}`,
        status: response.status,
      });

    const parsed = schema.safeParse(await response.json());

    return parsed.success
      ? ok(parsed.data)
      : err({
          source,
          message: `unexpected response: ${parsed.error.issues[0]?.message ?? '?'}`,
          status: null,
        });
  } catch (error) {
    return err({
      source,
      message: error instanceof Error ? error.message : String(error),
      status: null,
    });
  }
};
