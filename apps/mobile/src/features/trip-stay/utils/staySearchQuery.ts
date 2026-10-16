import { queryOptions, skipToken } from '@tanstack/react-query';
import type { HotelSearchRequest } from '@waypoint/contracts/hotels';
import { queryKeys } from '@/shared/utils/queryKeys';
import { searchStays } from './stayApi';

/** Prices move; the server keeps them a few minutes too. */
const STALE_MS = 5 * 60 * 1000;

/** Live stay prices for a search; skipped until the trip has a night. */
export const staySearchQuery = (request: HotelSearchRequest | undefined) =>
  queryOptions({
    queryKey: queryKeys.staySearch(request),
    queryFn: request === undefined ? skipToken : () => searchStays(request),
    staleTime: STALE_MS,
  });
