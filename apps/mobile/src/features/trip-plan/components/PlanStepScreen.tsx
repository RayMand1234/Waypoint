import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { useSpots } from '@/features/trip-spots';
import { errorMessage } from '@/shared/utils/errorMessage';
import { PlanStepForm } from './PlanStepForm';

/** Loads the trip and its destination's spots (for each stop's details), then shows step 6. */
export const PlanStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);
  const spots = useSpots(
    trip.data?.destinationId ?? null,
    trip.data?.styles ?? [],
  );
  const failed = [trip, spots].find((query) => query.isError);

  if (tripId === undefined) return <StepStatus error={NO_TRIP_MESSAGE} />;

  if (failed !== undefined)
    return (
      <StepStatus
        error={errorMessage(failed.error)}
        onRetry={() => void failed.refetch()}
      />
    );

  if (trip.isSuccess && trip.data.destinationId === null)
    return <StepStatus error="Pick a destination first." />;

  if (!trip.isSuccess || !spots.isSuccess) return <StepStatus />;

  return <PlanStepForm trip={trip.data} spots={spots.data} />;
};
