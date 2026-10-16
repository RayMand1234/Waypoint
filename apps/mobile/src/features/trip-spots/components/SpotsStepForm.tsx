import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import {
  routePicks,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { plural } from '@/shared/utils/text';
import { useSpotsForm } from '../hooks/useSpotsForm';
import { LengthControl } from './LengthControl';
import { SpotDetailsSheet } from './SpotDetailsSheet';
import { SpotList } from './SpotList';
import { TripBasics } from './TripBasics';

/** Step 3: when, who, how long, and which spots. */
export const SpotsStepForm = ({
  trip,
  spots,
}: {
  readonly trip: TripDetail;
  readonly spots: readonly Spot[];
}) => {
  const step = useSpotsForm(trip, spots);
  const { values } = step;

  return (
    <StepLayout
      step="spots"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question="When, and what to see?"
      onBack={step.navigation.back}
      onClose={step.navigation.close}
      footer={
        <StepFooter
          caption={step.caption}
          value={`${trip.destinationName ?? ''} · ${plural(step.days, 'day')}`}
          action={{
            label: 'Find a stay',
            onPress: () => void step.submit(),
            isDisabled: !step.canContinue,
            isLoading: step.isSaving,
          }}
          {...(step.error === undefined ? {} : { error: step.error })}
        />
      }
    >
      <TripBasics
        startDate={values.startDate}
        endDate={values.endDate}
        adults={values.adults}
        childrenAges={values.childrenAges}
        today={step.today}
        onDates={step.setDates}
        onTravelers={step.setTravelers}
      />
      <LengthControl days={step.days} onChange={step.setLength} />
      <SpotList
        spots={spots}
        selectedIds={values.spotIds}
        fits={step.fits}
        fitLabel={step.fitLabel}
        onToggle={step.toggleSpot}
        onInfo={step.openDetails}
      />
      {step.details !== undefined && (
        <SpotDetailsSheet
          spot={step.details}
          city={trip.destinationName}
          isTopPick={step.topPicks.has(step.details.id)}
          isSelected={values.spotIds.includes(step.details.id)}
          onToggle={step.toggleSpot}
          onClose={step.closeDetails}
        />
      )}
    </StepLayout>
  );
};
