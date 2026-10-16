import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Route, Screen, Text } from '@/shared/components';
import {
  PLANNING_STEP_COUNT,
  STEP_NAMES,
  stepKeySchema,
  stepNumber,
} from '../utils/steps';
import { useTripParams } from '../hooks/useTripParams';

/** Stands in for each step until it is built. */
export const StepPlaceholderScreen = () => {
  const params = useTripParams();
  const parsed = stepKeySchema.safeParse(params.step);
  const step = parsed.success ? parsed.data : 'style';
  const number = Math.min(stepNumber(step), PLANNING_STEP_COUNT);

  return (
    <Screen>
      <View style={styles.content}>
        <Route step={number} stepName={STEP_NAMES[step]} picks={[]} />
        <Text variant="title-lg">{STEP_NAMES[step]}</Text>
        <Text color="ink-muted">
          This step is coming next. Your trip is saved — you'll pick up right
          here.
        </Text>
        <Button
          label="Back to my waypoints"
          kind="secondary"
          onPress={() => {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create((theme) => ({
  content: {
    gap: theme.space[6],
    paddingTop: theme.space[6],
  },
}));
