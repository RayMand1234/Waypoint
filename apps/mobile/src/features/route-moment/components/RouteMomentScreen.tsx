import { router } from 'expo-router';
import type { TripDetail } from '@waypoint/contracts/trips';
import {
  NO_TRIP_MESSAGE,
  stepHref,
  StepStatus,
  useTrip,
  useTripParams,
} from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useMomentProgress } from '../hooks/useMomentProgress';
import { usePrefetchNextStep } from '../hooks/usePrefetchNextStep';
import {
  momentContent,
  momentLabels,
  NEXT_STEP,
  parseFinishedStep,
  type FinishedStep,
} from '../utils/momentContent';
import { MomentView } from './MomentView';

const Moment = ({
  trip,
  step,
}: {
  readonly trip: TripDetail;
  readonly step: FinishedStep;
}) => {
  const isDataReady = usePrefetchNextStep(step, trip);
  const progress = useMomentProgress(isDataReady);

  return (
    <MomentView
      step={step}
      content={momentContent(step, trip)}
      labels={momentLabels(step, trip)}
      tasksDone={progress.tasksDone}
      canContinue={progress.canContinue}
      reduceMotion={progress.reduceMotion}
      onContinue={() => {
        // Replace, so Back from the next step returns to the step before the moment.
        router.replace(stepHref(trip.id, NEXT_STEP[step]));
      }}
    />
  );
};

/** Between steps: loads the trip, then plays the route moment for the step just finished. */
export const RouteMomentScreen = () => {
  const params = useTripParams();
  const step = parseFinishedStep(params.step);
  const trip = useTrip(params.tripId);

  if (params.tripId === undefined)
    return <StepStatus error={NO_TRIP_MESSAGE} />;

  if (step === undefined)
    return (
      <StepStatus error="We lost track of where you were. Go back and continue again." />
    );

  if (trip.isError)
    return (
      <StepStatus
        error={errorMessage(trip.error)}
        onRetry={() => void trip.refetch()}
      />
    );

  if (trip.isPending) return <StepStatus />;

  return <Moment trip={trip.data} step={step} />;
};
