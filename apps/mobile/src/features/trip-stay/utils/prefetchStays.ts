import type { QueryClient } from '@tanstack/react-query';
import type { TripDetail } from '@waypoint/contracts/trips';
import { meQuery } from '@/features/profile';
import { destinationQuery } from '@/features/trip-destination';
import { spotsQuery } from '@/features/trip-spots';
import { warmQuery } from '@/shared/utils/warmQuery';
import { staySearchQuery } from './staySearchQuery';
import { stayRequest } from './stayRequest';

/**
 * Starts the stay search the Stay step will show — the slowest call in the
 * flow — from the same pieces it uses (profile, spots, city). Any failure is
 * left for the step itself to show.
 */
export const prefetchStays = async (
  queryClient: QueryClient,
  trip: TripDetail,
): Promise<void> => {
  if (trip.destinationId === null) return;

  const pieces = await Promise.all([
    queryClient.query(meQuery),
    queryClient.query(spotsQuery(trip.destinationId, trip.styles)),
    queryClient.query(destinationQuery(trip.destinationId)),
  ]).catch(() => undefined);

  if (pieces === undefined) return;

  const [me, spots, destination] = pieces;

  await warmQuery(
    queryClient,
    staySearchQuery(stayRequest(trip, spots, destination, me.currency)),
  );
};
