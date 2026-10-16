import type { TripDetail } from '@waypoint/contracts/trips';
import { Controller, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  routePicks,
  StepFooter,
  StepLayout,
  tripTitle,
} from '@/features/trip-flow';
import { SegmentedControl, Text } from '@/shared/components';
import { useStyleForm } from '../hooks/useStyleForm';
import { PACE_OPTIONS, stylesCountLabel } from '../utils/styleOptions';
import { StyleGrid } from './StyleGrid';

/** Step 1: what kind of trip, and at what pace. */
export const StyleStepForm = ({ trip }: { readonly trip: TripDetail }) => {
  const { control, submit, navigation, isSaving, error } = useStyleForm(trip);
  const picked = useWatch({ control, name: 'styles' });

  return (
    <StepLayout
      step="style"
      tripTitle={tripTitle(trip)}
      picks={routePicks(trip)}
      question="What kind of trip?"
      hint="Pick everything that fits. We'll match destinations and spots to it."
      onBack={navigation.back}
      onClose={navigation.close}
      footer={
        <StepFooter
          caption={stylesCountLabel(picked.length)}
          action={{
            label: 'Continue to destination',
            onPress: () => void submit(),
            isDisabled: picked.length === 0,
            isLoading: isSaving,
          }}
          {...(error === undefined ? {} : { error })}
        />
      }
    >
      <Controller
        control={control}
        name="styles"
        render={({ field }) => (
          <StyleGrid value={field.value} onChange={field.onChange} />
        )}
      />
      <View style={styles.pace}>
        <Text variant="label">Pace</Text>
        <Controller
          control={control}
          name="pace"
          render={({ field }) => (
            <SegmentedControl
              label="Pace"
              options={PACE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </View>
    </StepLayout>
  );
};

const styles = StyleSheet.create((theme) => ({
  pace: {
    gap: theme.space[2],
  },
}));
