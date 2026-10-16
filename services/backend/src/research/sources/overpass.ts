import { ok, type Result } from '@waypoint/contracts/common';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import { fetchJson, type SourceFailure } from './http.ts';

/** The main public instance (public mirrors proved unreliable); it is often busy, hence retries. */
const ENDPOINTS = ['https://overpass-api.de/api/interpreter'] as const;
const ATTEMPTS_PER_ENDPOINT = 3;
const RETRY_DELAY_MS = 5_000;
const TIMEOUT_MS = 120_000;
/** How far around the city centre to look, in degrees (~25 km). */
const BOX_DEGREES = 0.25;

/** The OpenStreetMap tags research reads, merged across the map objects of one place. */
export type OsmFacts = {
  readonly openingHours: string | undefined;
  readonly fee: string | undefined;
  readonly charge: string | undefined;
  readonly website: string | undefined;
  readonly street: string | undefined;
  readonly houseNumber: string | undefined;
  /** e.g. `way/123` — the object the facts came from. */
  readonly osmRef: string;
};

const responseSchema = z.object({
  elements: z.array(
    z.object({
      type: z.string(),
      id: z.number(),
      tags: z.record(z.string(), z.string()).default({}),
    }),
  ),
});

/** A place can be a building, a site outline and a point; the one with the most facts wins, gaps filled from the rest. */
const merge = (
  elements: readonly z.output<typeof responseSchema>['elements'][number][],
): OsmFacts | undefined => {
  const ranked = elements.toSorted(
    (a, b) => Object.keys(b.tags).length - Object.keys(a.tags).length,
  );
  const pick = (tag: string): string | undefined =>
    ranked
      .map((element) => element.tags[tag])
      .find((value) => value !== undefined);
  const first = ranked[0];

  return first === undefined
    ? undefined
    : {
        openingHours: pick('opening_hours'),
        fee: pick('fee'),
        charge: pick('charge'),
        website: pick('website') ?? pick('contact:website'),
        street: pick('addr:street'),
        houseNumber: pick('addr:housenumber'),
        osmRef: `${first.type}/${String(first.id)}`,
      };
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Tries each endpoint up to `ATTEMPTS_PER_ENDPOINT` times, pausing between tries; the last failure is returned. */
const withRetries = async <T, E>(
  attempts: () => readonly (() => Promise<Result<T, E>>)[],
): Promise<Result<T, E>> => {
  const tries = attempts().flatMap((attempt) =>
    Array.from({ length: ATTEMPTS_PER_ENDPOINT }, () => attempt),
  );

  return tries
    .reduce<Promise<Result<T, E> | undefined>>(
      async (previous, attempt, index) => {
        const last = await previous;

        if (last?.ok === true) return last;

        if (index > 0) await wait(RETRY_DELAY_MS);

        return attempt();
      },
      Promise.resolve(undefined),
    )
    .then((result) => {
      if (result === undefined)
        throw new Error('withRetries needs at least one attempt');

      return result;
    });
};

/** OpenStreetMap facts for the given Wikidata items near a point, keyed by Wikidata id. */
export const fetchOsmFacts = async (
  fetch: TracedFetch,
  center: { readonly lat: number; readonly lng: number },
  wikidataIds: readonly string[],
): Promise<Result<ReadonlyMap<string, OsmFacts>, SourceFailure>> => {
  if (wikidataIds.length === 0) return ok(new Map());

  const box = [
    center.lat - BOX_DEGREES,
    center.lng - BOX_DEGREES,
    center.lat + BOX_DEGREES,
    center.lng + BOX_DEGREES,
  ]
    .map(String)
    .join(',');
  const data = `[out:json][timeout:90];nwr["wikidata"~"^(${wikidataIds.join('|')})$"](${box});out tags;`;
  const response = await withRetries(() =>
    ENDPOINTS.map(
      (endpoint) => () =>
        fetchJson({
          fetch,
          source: 'openstreetmap',
          url: new URL(endpoint),
          init: {
            method: 'POST',
            body: new URLSearchParams({ data }),
            // Overpass answers 502 to `Accept: application/json`; it sends JSON anyway.
            headers: {
              'content-type': 'application/x-www-form-urlencoded',
              accept: '*/*',
            },
          },
          schema: responseSchema,
          timeoutMs: TIMEOUT_MS,
        }),
    ),
  );

  if (!response.ok) return response;

  return ok(
    new Map(
      wikidataIds.flatMap((id) => {
        const facts = merge(
          response.value.elements.filter(
            (element) => element.tags.wikidata === id,
          ),
        );

        return facts === undefined ? [] : [[id, facts] as const];
      }),
    ),
  );
};
