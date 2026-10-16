import { err, ok } from '@waypoint/contracts/common';
import type { SpotRating } from '@waypoint/contracts/destinations';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import type { ProviderFailure, ProviderResult } from '../types.ts';

// Google Places API (New). Its terms forbid storing what it returns except
// place ids: ratings are fetched live for one spot at a time and never cached
// or saved, and the app shows them with the Google Maps attribution.

const BASE_URL = 'https://places.googleapis.com/v1';
const TIMEOUT_MS = 5_000;
/** Only these fields are requested, so only their price tier is billed. */
const RATING_FIELDS = 'rating,userRatingCount,googleMapsUri';
const MATCH_FIELDS = 'places.id';
/** How far from the researched point a match may be, in metres. */
const MATCH_RADIUS_M = 300;

export type GooglePlaces = {
  readonly rating: (placeId: string) => ProviderResult<SpotRating>;
  /** The Google place id for a named spot at a point — used by research, once per spot. */
  readonly findPlaceId: (
    name: string,
    lat: number,
    lng: number,
  ) => ProviderResult<string | null>;
};

const ratingSchema = z.object({
  rating: z.number().min(0).max(5),
  userRatingCount: z.number().int().min(0).default(0),
  googleMapsUri: z.url(),
});
const searchSchema = z.object({
  places: z.array(z.object({ id: z.string() })).default([]),
});

export const createGooglePlaces = ({
  apiKey,
  fetch,
}: {
  readonly apiKey: string;
  readonly fetch: TracedFetch;
}): GooglePlaces => {
  const call = async <Schema extends z.ZodType>(
    url: URL,
    init: RequestInit,
    fieldMask: string,
    schema: Schema,
  ): ProviderResult<z.output<Schema>> => {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'x-goog-api-key': apiKey,
          'x-goog-fieldmask': fieldMask,
          'content-type': 'application/json',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (response.status === 404)
        return err<ProviderFailure>({ type: 'not-found' });

      if (!response.ok) {
        return err<ProviderFailure>({
          type: 'unavailable',
          status: response.status,
          message: `HTTP ${String(response.status)}`,
        });
      }

      const parsed = schema.safeParse(await response.json());

      return parsed.success
        ? ok(parsed.data)
        : err<ProviderFailure>({
            type: 'invalid-response',
            message: parsed.error.issues[0]?.message ?? '?',
          });
    } catch (error) {
      return error instanceof DOMException && error.name === 'TimeoutError'
        ? err<ProviderFailure>({ type: 'timeout' })
        : err<ProviderFailure>({
            type: 'unavailable',
            status: null,
            message: String(error),
          });
    }
  };

  return {
    rating: async (placeId) => {
      const result = await call(
        new URL(`${BASE_URL}/places/${encodeURIComponent(placeId)}`),
        { method: 'GET' },
        RATING_FIELDS,
        ratingSchema,
      );

      return result.ok
        ? ok({
            rating: result.value.rating,
            ratingCount: result.value.userRatingCount,
            googleMapsUri: result.value.googleMapsUri,
          })
        : result;
    },
    findPlaceId: async (name, lat, lng) => {
      const result = await call(
        new URL(`${BASE_URL}/places:searchText`),
        {
          method: 'POST',
          body: JSON.stringify({
            textQuery: name,
            maxResultCount: 1,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: MATCH_RADIUS_M,
              },
            },
          }),
        },
        MATCH_FIELDS,
        searchSchema,
      );

      return result.ok ? ok(result.value.places[0]?.id ?? null) : result;
    },
  };
};
