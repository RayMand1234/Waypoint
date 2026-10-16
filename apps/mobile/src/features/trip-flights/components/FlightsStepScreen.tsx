import { useMe } from '@/features/profile';
import { useDestination } from '@/features/trip-destination';
import {
  NO_TRIP_MESSAGE,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { flightRequest } from '../utils/flightRequest';
import { FlightsStepForm } from './FlightsStepForm';

/** Loads the trip, its destination's airport and the traveler's currency, then shows step 5. */
export const FlightsStepScreen = () => {
  const { tripId } = useTripParams();
  const trip = useTrip(tripId);
  const me = useMe();
  const destination = useDestination(trip.data?.destinationId ?? null);
  const failed = [trip, me, destination].find((query) => query.isError);

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

  if (!trip.isSuccess || !me.isSuccess || !destination.isSuccess)
    return <StepStatus />;

  const request = flightRequest(
    trip.data,
    destination.data.airport,
    me.data.currency,
  );

  return (
    <FlightsStepForm
      trip={trip.data}
      request={request.ok ? request.value : undefined}
      missingMessage={request.ok ? '' : request.error}
    />
  );
};
