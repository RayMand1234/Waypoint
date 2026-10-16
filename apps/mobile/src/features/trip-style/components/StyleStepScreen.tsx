import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { StyleStepForm } from './StyleStepForm';

/** Loads the trip, then shows step 1 with its saved picks. */
export const StyleStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);

  if (tripId === undefined) return <StepStatus error={NO_TRIP_MESSAGE} />;

  if (trip.isPending) return <StepStatus />;

  if (trip.isError)
    return (
      <StepStatus
        error={errorMessage(trip.error)}
        onRetry={() => void trip.refetch()}
      />
    );

  return <StyleStepForm trip={trip.data} />;
};
