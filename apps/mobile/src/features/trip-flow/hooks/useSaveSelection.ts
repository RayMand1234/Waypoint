import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PutSelectionRequest,
  SelectionKind,
  TripDetail,
} from '@waypoint/contracts/trips';
import { queryKeys } from '@/shared/utils/queryKeys';
import { withSelection } from '../utils/selections';
import { saveSelection } from '../utils/tripApi';

/** Saves the offer chosen for one part of the trip: the cached trip takes it at once; Home's list is refetched. */
export const useSaveSelection = (tripId: string, kind: SelectionKind) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (selection: PutSelectionRequest) =>
      saveSelection(tripId, kind, selection),
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
