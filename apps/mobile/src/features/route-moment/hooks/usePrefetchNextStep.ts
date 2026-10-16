import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { TripDetail } from '@waypoint/contracts/trips';
import { destinationsQuery } from '@/features/trip-destination';
import { prefetchFlights } from '@/features/trip-flights';
import { prefetchPlan } from '@/features/trip-plan';
import { spotsQuery } from '@/features/trip-spots';
import { prefetchStays } from '@/features/trip-stay';
import { queryKeys } from '@/shared/utils/queryKeys';
import { warmQuery } from '@/shared/utils/warmQuery';
import type { FinishedStep } from '../utils/momentContent';

type Prefetch = (queryClient: QueryClient, trip: TripDetail) => Promise<void>;

const NOTHING_YET: Prefetch = () => Promise.resolve();

/** The next step's slow call, by the step just finished. Each settles, failure or not. */
const PREFETCH: Readonly<Record<FinishedStep, Prefetch>> = {
  1: (queryClient, trip) =>
    warmQuery(queryClient, destinationsQuery(trip.styles)),
  2: (queryClient, trip) =>
    warmQuery(queryClient, spotsQuery(trip.destinationId, trip.styles)),
  3: prefetchStays,
  4: prefetchFlights,
  5: prefetchPlan,
  // The summary has no data to load yet.
  6: NOTHING_YET,
};

/**
 * Starts the next step's slow call while the moment plays; `true` once it has
 * settled. A failure still settles: the next step shows its own retry.
 */
export const usePrefetchNextStep = (
  step: FinishedStep,
  trip: TripDetail,
): boolean => {
  const queryClient = useQueryClient();
  const warmUp = useQuery({
    queryKey: queryKeys.momentPrefetch(trip.id, step),
    queryFn: () => PREFETCH[step](queryClient, trip).then(() => true),
    // Runs once per moment, then is forgotten.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  return warmUp.isSuccess;
};
