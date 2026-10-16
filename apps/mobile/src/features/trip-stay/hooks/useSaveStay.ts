import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PutSelectionRequest,
  TripDetail,
} from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { saveStay } from '../utils/stayApi';
import { withSelection } from '../utils/staySelection';

/** Saves the chosen stay: the cached trip takes it at once; the Home list is refetched. */
export const useSaveStay = (tripId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (selection: PutSelectionRequest) => saveStay(tripId, selection),
    onSuccess: (selection) => {
      queryClient.setQueryData<TripDetail>(queryKeys.trip(tripId), (cached) =>
        cached === undefined ? undefined : withSelection(cached, selection),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.trips,
        exact: true,
      });
    },
  });
};
