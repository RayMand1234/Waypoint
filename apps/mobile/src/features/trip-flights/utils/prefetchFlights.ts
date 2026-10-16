import type { QueryClient } from '@tanstack/react-query';
import type { TripDetail } from '@waypoint/contracts/trips';
import { meQuery } from '@/features/profile';
import { destinationQuery } from '@/features/trip-destination';
import { warmQuery } from '@/shared/utils/warmQuery';
import { flightRequest } from './flightRequest';
import { flightSearchQuery } from './flightSearchQuery';

/**
 * Starts the fare search the Flights step will show, from the same pieces it
 * uses (profile, destination). Any failure is left for the step to show.
 */
export const prefetchFlights = async (
  queryClient: QueryClient,
  trip: TripDetail,
): Promise<void> => {
  if (trip.destinationId === null) return;

  const pieces = await Promise.all([
    queryClient.query(meQuery),
    queryClient.query(destinationQuery(trip.destinationId)),
  ]).catch(() => undefined);

  if (pieces === undefined) return;

  const [me, destination] = pieces;
  const request = flightRequest(trip, destination.airport, me.currency);

  if (request.ok)
    await warmQuery(queryClient, flightSearchQuery(request.value));
};
