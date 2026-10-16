import {
  getDestinationResponseSchema,
  listDestinationsResponseSchema,
  type Destination,
  type DestinationSuggestion,
} from '@waypoint/contracts/destinations';
import {
  searchAirportsResponseSchema,
  searchPlacesResponseSchema,
  type Airport,
  type PlaceSuggestion,
} from '@waypoint/contracts/geo';
import type { TripStyle } from '@waypoint/contracts/trips';
import { apiRequest } from '@/shared/utils/apiClient';

/** Curated destinations, best match for the styles first. */
export const fetchDestinations = async (
  styles: readonly TripStyle[],
): Promise<readonly DestinationSuggestion[]> =>
  (
    await apiRequest(
      `/destinations?styles=${encodeURIComponent(styles.join(','))}`,
      listDestinationsResponseSchema,
    )
  ).destinations;

export const searchAirports = async (
  query: string,
): Promise<readonly Airport[]> =>
  (
    await apiRequest(
      `/airports?q=${encodeURIComponent(query)}`,
      searchAirportsResponseSchema,
    )
  ).airports;

/** Cities matching what the traveler typed, anywhere in the world. */
export const searchCities = async (
  query: string,
): Promise<readonly PlaceSuggestion[]> =>
  (
    await apiRequest(
      `/places?q=${encodeURIComponent(query)}&type=locality`,
      searchPlacesResponseSchema,
    )
  ).places;

/** The destination for a searched city — curated if we have it, else added for this trip. */
export const addDestination = async (placeId: string): Promise<Destination> =>
  (
    await apiRequest('/destinations', getDestinationResponseSchema, {
      method: 'POST',
      body: { placeId },
    })
  ).destination;

export const fetchDestination = async (
  destinationId: string,
): Promise<Destination> =>
  (
    await apiRequest(
      `/destinations/${encodeURIComponent(destinationId)}`,
      getDestinationResponseSchema,
    )
  ).destination;
