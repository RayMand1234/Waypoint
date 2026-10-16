import { useMe } from '@/features/profile';
import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { useDestination } from '@/features/trip-destination';
import { useSpots } from '@/features/trip-spots';
import { errorMessage } from '@/shared/utils/errorMessage';
import { stayRequest } from '../utils/stayRequest';
import { StayStepForm } from './StayStepForm';

/** Loads the trip, its spots, its city and the traveler's currency, then shows step 4. */
export const StayStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);
  const me = useMe();
  const destinationId = trip.data?.destinationId ?? null;
  const spots = useSpots(destinationId, trip.data?.styles ?? []);
  const destination = useDestination(destinationId);
  const failed = [trip, me, spots, destination].find((query) => query.isError);

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

  if (
    !trip.isSuccess ||
    !me.isSuccess ||
    !spots.isSuccess ||
    !destination.isSuccess
  )
    return <StepStatus />;

  return (
    <StayStepForm
      trip={trip.data}
      request={stayRequest(
        trip.data,
        spots.data,
        destination.data,
        me.data.currency,
      )}
    />
  );
};
