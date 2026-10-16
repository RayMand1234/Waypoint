import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Chip, Route } from '@/shared/components';
import { GallerySection } from './GallerySection';

const STEP_NAMES = [
  'Trip style',
  'Destination',
  'Spots & dates',
  'Stay',
  'Flights',
  'Day plan',
] as const;
const PICKS = [
  'Views +2',
  'Lisbon',
  '5 days',
  'Casa',
  'TAP direct',
  '16 stops',
] as const;

/** The Route at every step; picking a step replays the glide. */
export const RouteDemo = () => {
  const [step, setStep] = useState(4);

  return (
    <GallerySection title="Route">
      <Route
        key={step}
        step={step}
        stepName={STEP_NAMES[step - 1] ?? ''}
        picks={PICKS}
        onCheckpointPress={setStep}
      />
      <View style={styles.steps}>
        {STEP_NAMES.map((name, index) => (
          <Chip
            key={name}
            label={String(index + 1)}
            isSelected={step === index + 1}
            onPress={() => {
              setStep(index + 1);
            }}
          />
        ))}
      </View>
    </GallerySection>
  );
};

const styles = StyleSheet.create((theme) => ({
  steps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
    paddingTop: theme.space[4],
  },
}));
