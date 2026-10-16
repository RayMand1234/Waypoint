import type { TripListItem } from '@waypoint/contracts/trips';
import { router } from 'expo-router';
import { stepHref } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useCreateTrip } from './useCreateTrip';

/** Creates a draft — fresh, or copying a past trip's style and party — and opens step 1. */
export const useStartPlanning = () => {
  const create = useCreateTrip();

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
    isCreating: create.isPending,
    error: create.error === null ? undefined : errorMessage(create.error),
  };
};
