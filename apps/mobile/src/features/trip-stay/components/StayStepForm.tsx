import type { HotelSearchRequest } from '@waypoint/contracts/hotels';
import type { TripDetail } from '@waypoint/contracts/trips';
import {
  routePicks,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { SegmentedControl } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { useStayStep } from '../hooks/useStayStep';
import { stayCard } from '../utils/stayCardModel';
import { STAY_MODES } from '../utils/stayOrder';
import { stayHint } from '../utils/stayRequest';
import { StayDetailsSheet } from './StayDetailsSheet';
import { StayResults } from './StayResults';

/** Step 4: where to sleep, near the spots picked in step 3. */
export const StayStepForm = ({
  trip,
  request,
}: {
  readonly trip: TripDetail;
  readonly request: HotelSearchRequest | undefined;
}) => {
  const step = useStayStep(trip, request);
  const { pick, details } = step;
  const hint = stayHint(trip, request);

  return (
    <StepLayout
      step="stay"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question="Where to sleep"
      {...(hint === undefined ? {} : { hint })}
      onBack={step.navigation.back}
      onCheckpointPress={step.navigation.jumpBack}
      onClose={step.navigation.close}
      footer={
        <StepFooter
          caption="Your stay"
          value={
            pick.picked === undefined
              ? 'Pick a stay'
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
      <SegmentedControl
        label="What matters most"
        options={STAY_MODES}
        value={pick.mode}
        onChange={pick.changeMode}
      />
      <StayResults
        state={step.results}
        pickedId={pick.picked?.hotel.id}
        onPick={pick.pick}
        onDetails={details.open}
        onRetry={step.retry}
      />
      {details.offer !== undefined && (
        <StayDetailsSheet
          offer={details.offer}
          card={stayCard(details.offer, step.highlights)}
          detail={details.detail}
          photos={details.photos}
          reviews={details.reviews}
          isPicked={details.offer.hotel.id === pick.picked?.hotel.id}
          onPick={(hotelId) => {
            pick.pick(hotelId);
            details.close();
          }}
          onClose={details.close}
        />
      )}
    </StepLayout>
  );
};
