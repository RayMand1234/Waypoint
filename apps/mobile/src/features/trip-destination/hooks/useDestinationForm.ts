import { zodResolver } from '@hookform/resolvers/zod';
import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useForm } from 'react-hook-form';
import { useStepNavigation, useUpdateTrip } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import {
  destinationFormSchema,
  toChosen,
  type ChosenDestination,
  type DestinationFormOutput,
  type DestinationFormValues,
} from '../utils/destinationFormSchema';

/**
 * The trip's destination — one of ours (with its country), or one found by
 * search earlier — else the best suggestion.
 */
const initialDestination = (
  trip: TripDetail,
  destinations: readonly DestinationSuggestion[],
): ChosenDestination | null => {
  const saved = destinations.find((d) => d.id === trip.destinationId);

  if (saved !== undefined) return toChosen(saved);

  if (trip.destinationId !== null && trip.destinationName !== null)
    return {
      id: trip.destinationId,
      name: trip.destinationName,
      countryName: '',
    };

  return destinations[0] === undefined ? null : toChosen(destinations[0]);
};

/**
 * Step 2: where to, and from which airport. The airport starts as the trip's,
 * else the traveler's home airport. Saved on Continue, then on to Spots.
 */
export const useDestinationForm = (
  trip: TripDetail,
  homeAirport: string | null,
  destinations: readonly DestinationSuggestion[],
) => {
  const update = useUpdateTrip(trip.id);
  const navigation = useStepNavigation(trip.id);
  const form = useForm<DestinationFormValues, unknown, DestinationFormOutput>({
    resolver: zodResolver(destinationFormSchema),
    defaultValues: {
      destination: initialDestination(trip, destinations),
      originAirport: trip.originAirport ?? homeAirport ?? '',
    },
  });

  const submit = form.handleSubmit(({ destination, originAirport }) => {
    update.mutate(
      {
        destinationId: destination.id,
        destinationName: destination.name,
        originAirport,
      },
      {
        onSuccess: () => {
          navigation.finish('destination');
        },
      },
    );
  });

  return {
    control: form.control,
    submit,
    navigation,
    isSaving: update.isPending,
    error: update.error === null ? undefined : errorMessage(update.error),
  };
};
