import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import type { HotelSearchRequest } from '@waypoint/contracts/hotels';

// Every React Query key in the app, by resource path, most specific last —
// one definition so features that read or update the same resource agree.

export const queryKeys = {
  me: ['me'] as const,
  /** The list of my trips (Home). */
  trips: ['trips'] as const,
  /** One trip with its spots, plan and selections. */
  trip: (tripId: string) => ['trips', tripId] as const,
  destinations: (styles: readonly string[]) =>
    ['destinations', { styles }] as const,
  destination: (destinationId: string) =>
    ['destinations', destinationId] as const,
  spots: (destinationId: string, styles: readonly string[]) =>
    ['destinations', destinationId, 'spots', { styles }] as const,
  airports: (query: string) => ['airports', query] as const,
  /** City search (place autocomplete, cities only). */
  cities: (query: string) => ['places', { query, type: 'locality' }] as const,
  /** Live stay prices for one search (its whole request is the key). */
  staySearch: (request: HotelSearchRequest | undefined) =>
    ['hotels', 'search', request] as const,
  hotel: (hotelId: string) => ['hotels', hotelId] as const,
  /** Live fares for one search (its whole request is the key). */
  flightSearch: (request: FlightSearchRequest | undefined) =>
    ['flights', 'search', request] as const,
  /** The route moment's warm-up of the next step (its own root, so trip refreshes don't rerun it). */
  momentPrefetch: (tripId: string, step: number) =>
    ['moment-prefetch', tripId, step] as const,
};
