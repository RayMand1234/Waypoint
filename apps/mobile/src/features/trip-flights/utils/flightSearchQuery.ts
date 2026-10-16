import { queryOptions, skipToken } from '@tanstack/react-query';
import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import { queryKeys } from '@/shared/utils/queryKeys';
import { searchFlights } from './flightsApi';

/** Fares move fast; the server keeps them a few minutes too. */
const STALE_MS = 5 * 60 * 1000;

/** Live fares for a search; skipped until the trip can be searched. */
export const flightSearchQuery = (request: FlightSearchRequest | undefined) =>
  queryOptions({
    queryKey: queryKeys.flightSearch(request),
    queryFn: request === undefined ? skipToken : () => searchFlights(request),
    staleTime: STALE_MS,
  });
