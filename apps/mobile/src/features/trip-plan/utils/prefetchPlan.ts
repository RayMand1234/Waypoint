import type { QueryClient } from '@tanstack/react-query';
import type { TripDetail } from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { buildPlan } from './planApi';

/**
 * Builds the plan while the route moment plays, so the Plan step opens with
 * it. Unlike other warm-ups this writes — the plan is saved as it's built.
 * A trip that already has one keeps it; any failure is left for the step.
 */
export const prefetchPlan = async (
  queryClient: QueryClient,
  trip: TripDetail,
): Promise<void> => {
  if (trip.days.length > 0) return;

  await buildPlan(trip.id, {}).then(
    ({ days }) => {
      queryClient.setQueryData<TripDetail>(queryKeys.trip(trip.id), (cached) =>
        cached === undefined ? undefined : { ...cached, days },
      );
    },
    () => undefined,
  );
};
