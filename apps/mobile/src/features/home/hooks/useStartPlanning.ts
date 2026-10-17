import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Destination } from '@waypoint/contracts/destinations';
import type { TripListItem } from '@waypoint/contracts/trips';
import { router } from 'expo-router';
import { stepHref, updateTrip } from '@/features/trip-flow';
import { queryKeys } from '@/shared/utils/queryKeys';
import { createTrip } from '../utils/tripsApi';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useCreateTrip } from './useCreateTrip';

/** Creates a draft — fresh, copying a past trip's style and party, or already set to a place — and opens step 1. */
export const useStartPlanning = () => {
  const create = useCreateTrip();
  const queryClient = useQueryClient();
  // A place picked on Home: the draft is created with it as its destination.
  const createAt = useMutation({
    mutationFn: async (destination: Pick<Destination, 'id' | 'name'>) => {
      const trip = await createTrip({});

      return updateTrip(trip.id, {
        destinationId: destination.id,
        destinationName: destination.name,
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
  });
  const error = create.error ?? createAt.error;

  const openStyleStep = (trip: { readonly id: string }): void => {
    router.push(stepHref(trip.id, 'style'));
  };

  return {
    startNew: () => {
      create.mutate({}, { onSuccess: openStyleStep });
    },
    planAgain: (trip: TripListItem) => {
      create.mutate(
        {
          styles: trip.styles,
          pace: trip.pace,
          adults: trip.adults,
          childrenAges: trip.childrenAges,
          originAirport: trip.originAirport,
        },
        { onSuccess: openStyleStep },
      );
    },
    startAt: (destination: Pick<Destination, 'id' | 'name'>) => {
      createAt.mutate(destination, { onSuccess: openStyleStep });
    },
    isCreating: create.isPending || createAt.isPending,
    error: error === null ? undefined : errorMessage(error),
  };
};
