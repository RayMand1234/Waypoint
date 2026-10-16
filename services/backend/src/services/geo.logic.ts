import type { Airport } from '@waypoint/contracts/geo';
import { distanceMeters, type LatLng } from '../lib/distance.ts';
import { fold } from '../lib/text.ts';

/** 0 = the city is what was typed (or its code), 1 = the name contains it, 2 = a loose match. */
const relevance = (airport: Airport, query: string): number => {
  if (fold(airport.city) === query || fold(airport.iata) === query) return 0;

  return fold(airport.name).includes(query) ||
    fold(airport.city).includes(query)
    ? 1
    : 2;
};

/**
 * Airports in the city the traveler typed first, then names containing it,
 * then loose matches ("rome" also finds "Romero" in San Salvador). Stable, so
 * the provider's own order — city-wide codes like "Rome – All Airports" first —
 * is kept within each group.
 */
export const rankAirports = (
  airports: readonly Airport[],
  query: string,
): Airport[] => {
  const folded = fold(query);

  return airports.toSorted(
    (a, b) => relevance(a, folded) - relevance(b, folded),
  );
};

/** How far from a city its airport may be when the airport isn't named after it. */
const MAX_AIRPORT_DISTANCE_M = 150_000;

export type AirportCity = LatLng & {
  readonly name: string;
  readonly countryCode: string;
};

/**
 * The airport to fly into for a city: one listed under the city's own name
 * (the provider lists a city-wide code like ROM first), else the nearest
 * airport in the same country within reach. `undefined` when there is none.
 */
export const cityAirport = (
  airports: readonly Airport[],
  city: AirportCity,
): Airport | undefined => {
  const inCountry = airports.filter(
    (airport) => airport.country === city.countryCode,
  );
  const named = inCountry.find(
    (airport) => fold(airport.city) === fold(city.name),
  );

  if (named !== undefined) return named;

  return inCountry
    .flatMap((airport) =>
      airport.lat === null || airport.lng === null
        ? []
        : [
            {
              airport,
              meters: distanceMeters(city, {
                lat: airport.lat,
                lng: airport.lng,
              }),
            },
          ],
    )
    .filter(({ meters }) => meters <= MAX_AIRPORT_DISTANCE_M)
    .toSorted((a, b) => a.meters - b.meters)[0]?.airport;
};
