import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useSpots } from '../hooks/useSpots';
import { SpotsStepForm } from './SpotsStepForm';

/** Loads the trip and its destination's spots, then shows step 3. */
export const SpotsStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);
  const spots = useSpots(
    trip.data?.destinationId ?? null,
    trip.data?.styles ?? [],
  );

  if (tripId === undefined) return <StepStatus error={NO_TRIP_MESSAGE} />;

  if (trip.isError)
    return (
      <StepStatus
        error={errorMessage(trip.error)}
        onRetry={() => void trip.refetch()}
      />
    );

  if (trip.isPending) return <StepStatus />;

  if (trip.data.destinationId === null)
    return <StepStatus error="Pick a destination first." />;

  if (spots.isError)
    return (
      <StepStatus
        error={errorMessage(spots.error)}
        onRetry={() => void spots.refetch()}
      />
    );

  if (spots.isPending) return <StepStatus />;

  return <SpotsStepForm trip={trip.data} spots={spots.data} />;
};
