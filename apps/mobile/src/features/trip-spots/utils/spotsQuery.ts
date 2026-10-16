import { queryOptions, skipToken } from '@tanstack/react-query';
import type { TripStyle } from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchSpots } from './spotsApi';

/** A destination's spots for the trip's styles; skipped until there is a destination. */
export const spotsQuery = (
  destinationId: string | null,
  styles: readonly TripStyle[],
) =>
  queryOptions({
    queryKey: queryKeys.spots(destinationId ?? '', styles),
    queryFn:
      destinationId === null
        ? skipToken
        : () => fetchSpots(destinationId, styles),
  });
