import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TripDetail, UpdateTripRequest } from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { updateTrip } from '../utils/tripApi';

/**
 * Saves a step's picks. The cached trip takes the fresh fields at once (and
 * the new spots, if they were sent); the Home list is refetched.
 */
export const useUpdateTrip = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: UpdateTripRequest) => updateTrip(tripId, changes),
    onSuccess: (trip, changes) => {
      queryClient.setQueryData<TripDetail>(queryKeys.trip(tripId), (cached) =>
        cached === undefined
          ? undefined
          : { ...cached, ...trip, spots: changes.spots ?? cached.spots },
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trips,
        exact: true,
      });
    },
  });
};
