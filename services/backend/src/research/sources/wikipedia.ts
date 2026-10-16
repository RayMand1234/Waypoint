import { ok, type Result } from '@waypoint/contracts/common';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import { fetchJson, type SourceFailure } from './http.ts';

const TIMEOUT_MS = 20_000;
const MONTHS = 3;
/** Wikimedia answers 404 for an article with no views in the range. */
const NO_VIEWS_STATUS = 404;

const responseSchema = z.object({
  items: z.array(z.object({ views: z.number().int().min(0) })).default([]),
});

const yyyymmdd = (date: Date): string =>
  date.toISOString().slice(0, 10).replaceAll('-', '');

/**
 * English Wikipedia page views over the last three full months. An article
 * nobody read is 0; a failed request is a failure, never a 0.
 */
export const fetchPageViews = async (
  fetch: TracedFetch,
  title: string,
  now: Date,
): Promise<Result<number, SourceFailure>> => {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  const start = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (MONTHS - 1), 1),
  );
  const url = new URL(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(
      title,
    )}/monthly/${yyyymmdd(start)}00/${yyyymmdd(end)}00`,
  );
  const response = await fetchJson({
    fetch,
    source: 'wikipedia',
    url,
    schema: responseSchema,
    timeoutMs: TIMEOUT_MS,
  });

  if (response.ok)
    return ok(response.value.items.reduce((sum, item) => sum + item.views, 0));

  return response.error.status === NO_VIEWS_STATUS ? ok(0) : response;
};
