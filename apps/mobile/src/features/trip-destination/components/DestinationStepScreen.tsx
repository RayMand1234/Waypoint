import { useMe } from '@/features/profile';
import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useDestinations } from '../hooks/useDestinations';
import { DestinationStepForm } from './DestinationStepForm';

/** Loads the trip, the traveler's home airport and the suggestions, then shows step 2. */
export const DestinationStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);
  const me = useMe();
  const destinations = useDestinations(trip.data?.styles ?? []);

  if (tripId === undefined) return <StepStatus error={NO_TRIP_MESSAGE} />;

  if (trip.isError)
    return (
      <StepStatus
        error={errorMessage(trip.error)}
        onRetry={() => void trip.refetch()}
      />
    );

  if (destinations.isError) {
    return (
      <StepStatus
        error={errorMessage(destinations.error)}
        onRetry={() => void destinations.refetch()}
      />
    );
  }

  // The home airport only sets a default, so a profile that fails to load doesn't block the step.
  if (trip.isPending || destinations.isPending || me.isPending)
    return <StepStatus />;

  return (
    <DestinationStepForm
      trip={trip.data}
      homeAirport={me.data?.homeAirport ?? null}
      destinations={destinations.data}
    />
  );
};
