import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import {
  routePicks,
  STYLE_SHORT_NAMES,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { useDestinationForm } from '../hooks/useDestinationForm';
import { AirportSheet } from './AirportSheet';
import { DestinationPicker } from './DestinationPicker';
import { OriginField } from './OriginField';

type DestinationStepFormProps = {
  readonly trip: TripDetail;
  readonly homeAirport: string | null;
  readonly destinations: readonly DestinationSuggestion[];
};

/** "Picked for views, culture and food." */
const pickedFor = (trip: TripDetail): string =>
  trip.styles.length === 0
    ? 'Our favourite cities.'
    : `Picked for ${trip.styles.map((style) => STYLE_SHORT_NAMES[style].toLowerCase()).join(', ')}.`;

/** Step 2: where to, and from where. */
export const DestinationStepForm = ({
  trip,
  homeAirport,
  destinations,
}: DestinationStepFormProps) => {
  const { control, submit, navigation, isSaving, error } = useDestinationForm(
    trip,
    homeAirport,
    destinations,
  );
  const [isAirportOpen, setAirportOpen] = useState(false);
  const chosen = useWatch({ control, name: 'destination' });

  return (
    <StepLayout
      step="destination"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question="Where to?"
      hint={pickedFor(trip)}
      onBack={navigation.back}
      onCheckpointPress={navigation.jumpBack}
      onClose={navigation.close}
      footer={
        <StepFooter
          caption="Going to"
          value={
            chosen === null
              ? 'Choose a destination'
              : [chosen.name, chosen.countryName]
                  .filter((part) => part !== '')
                  .join(', ')
          }
          action={{
            label: 'Choose spots',
            onPress: () => void submit(),
            isDisabled: chosen === null,
            isLoading: isSaving,
          }}
          {...(error === undefined ? {} : { error })}
        />
      }
    >
      <Controller
        control={control}
        name="originAirport"
        render={({ field, fieldState }) => (
          <>
            <OriginField
              airport={field.value}
              onPress={() => {
                setAirportOpen(true);
              }}
              {...(fieldState.error?.message === undefined
                ? {}
                : { error: fieldState.error.message })}
            />
            <AirportSheet
              isOpen={isAirportOpen}
              onClose={() => {
                setAirportOpen(false);
              }}
              onPick={field.onChange}
            />
          </>
        )}
      />
      <Controller
        control={control}
        name="destination"
        render={({ field }) => (
          <DestinationPicker
            suggestions={destinations}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </StepLayout>
  );
};
