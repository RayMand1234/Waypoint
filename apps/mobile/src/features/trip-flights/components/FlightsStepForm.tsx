import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import type { TripDetail } from '@waypoint/contracts/trips';
import {
  routePicks,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { formatMoney } from '@/shared/utils/format';
import { useFlightsStep } from '../hooks/useFlightsStep';
import { flightCard } from '../utils/flightCardModel';
import { flightHint } from '../utils/flightHint';
import { FlightDetailsSheet } from './FlightDetailsSheet';
import { FlightFilters } from './FlightFilters';
import { FlightResults } from './FlightResults';

/** Step 5: the round trip, best value first, with a few filters. */
export const FlightsStepForm = ({
  trip,
  request,
  missingMessage,
}: {
  readonly trip: TripDetail;
  readonly request: FlightSearchRequest | undefined;
  /** Why there's nothing to search yet, when `request` is missing. */
  readonly missingMessage: string;
}) => {
  const step = useFlightsStep(trip, request, missingMessage);
  const { pick, details } = step;
  const travelers = trip.adults + trip.childrenAges.length;
  const hint = flightHint(request, trip.childrenAges);

  return (
    <StepLayout
      step="flights"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question="Choose your flight"
      {...(hint === undefined ? {} : { hint })}
      onBack={step.navigation.back}
      onClose={step.navigation.close}
      footer={
        <StepFooter
          caption="Your flight"
          value={
            pick.picked === undefined
              ? 'Pick a flight'
              : formatMoney(pick.picked.bestPrice)
          }
          action={{
            label: 'Plan my days',
            onPress: step.choose,
            isDisabled: !step.canChoose,
            isLoading: step.isSaving,
          }}
          {...(step.saveError === undefined ? {} : { error: step.saveError })}
        />
      }
    >
      <FlightFilters filters={pick.filters} onToggle={pick.toggle} />
      <FlightResults
        state={step.results}
        bestValue={step.bestValue}
        travelers={travelers}
        pickedId={pick.picked?.id}
        onPick={pick.pick}
        onDetails={step.openDetails}
        onRetry={step.retry}
        onClearFilters={pick.clearFilters}
      />
      {details !== undefined && (
        <FlightDetailsSheet
          offer={details}
          card={flightCard(details, step.bestValue, travelers)}
          travelers={travelers}
          isPicked={details.id === pick.picked?.id}
          onPick={(offerId) => {
            pick.pick(offerId);
            step.closeDetails();
          }}
          onClose={step.closeDetails}
        />
      )}
    </StepLayout>
  );
};
