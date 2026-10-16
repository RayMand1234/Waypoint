import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BuildPlanRequest, TripDetail } from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { buildPlan } from '../utils/planApi';

/** Builds (or re-arranges) and saves the plan: the cached trip takes the new days at once; Home's list is refetched. */
export const useBuildPlan = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BuildPlanRequest) => buildPlan(tripId, request),
    onSuccess: ({ days }) => {
      queryClient.setQueryData<TripDetail>(queryKeys.trip(tripId), (cached) =>
        cached === undefined ? undefined : { ...cached, days },
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trips,
        exact: true,
      });
    },
  });
};
