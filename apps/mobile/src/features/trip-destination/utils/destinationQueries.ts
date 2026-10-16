import { queryOptions, skipToken } from '@tanstack/react-query';
import type { TripStyle } from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchDestination, fetchDestinations } from './destinationsApi';

/** Suggested destinations for the trip's styles, best match first. */
export const destinationsQuery = (styles: readonly TripStyle[]) =>
  queryOptions({
    queryKey: queryKeys.destinations(styles),
    queryFn: () => fetchDestinations(styles),
  });

/** One destination (curated or added from search); skipped without an id. */
export const destinationQuery = (destinationId: string | null) =>
  queryOptions({
    queryKey: queryKeys.destination(destinationId ?? ''),
    queryFn:
      destinationId === null
        ? skipToken
        : () => fetchDestination(destinationId),
  });
