import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TripListItem } from '@waypoint/contracts/trips';
import { Alert } from 'react-native';
import { errorMessage } from '@/shared/utils/errorMessage';
import { queryKeys } from '@/shared/utils/queryKeys';
import { deleteTrip } from '../utils/tripsApi';

/**
 * Deletes a draft after the traveler confirms. Its row leaves the list at
 * once and comes back if the delete fails; its cached detail is dropped.
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: deleteTrip,
    onMutate: async (tripId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.trips,
        exact: true,
      });

      const before = queryClient.getQueryData<readonly TripListItem[]>(
        queryKeys.trips,
      );

      queryClient.setQueryData<readonly TripListItem[]>(
        queryKeys.trips,
        (trips) => trips?.filter((trip) => trip.id !== tripId),
      );

      return { before };
    },
    onError: (_error, _tripId, context) => {
      queryClient.setQueryData(queryKeys.trips, context?.before);
    },
    onSuccess: (_result, tripId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.trip(tripId),
        exact: true,
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.trips, exact: true }),
  });

  return {
    /** Asks first — a deleted draft can't be brought back. */
    askToDelete: (tripId: string, title: string) => {
      Alert.alert(
        `Delete ${title}?`,
        'This draft and everything picked for it is deleted for good.',
        [
          { text: 'Keep it', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              remove.mutate(tripId);
            },
          },
        ],
      );
    },
    error: remove.error === null ? undefined : errorMessage(remove.error),
  };
};
