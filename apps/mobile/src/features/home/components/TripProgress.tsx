import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { PLANNING_STEP_COUNT } from '@/features/trip-flow';

/** Six segments: done in midnight-900, the current step in midnight-100, the rest empty (brand book). */
export const TripProgress = ({ completed }: { readonly completed: number }) => (
  <View
    style={styles.track}
    accessibilityRole="progressbar"
    accessibilityLabel={`${String(completed)} of ${String(PLANNING_STEP_COUNT)} steps done`}
    accessibilityValue={{ min: 0, max: PLANNING_STEP_COUNT, now: completed }}
  >
    {Array.from({ length: PLANNING_STEP_COUNT }, (_, index) => (
      <View
        key={index}
        style={styles.segment(
          index < completed ? 'done' : index === completed ? 'current' : 'todo',
        )}
      />
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.space[1],
    maxWidth: theme.size['progress-track-max'],
  },
  segment: (state: 'done' | 'current' | 'todo') => ({
    flex: 1,
    height: theme.size['progress-h'],
    borderRadius: theme.radius.full,
    backgroundColor:
      state === 'done'
        ? theme.colors['midnight-900']
        : state === 'current'
          ? theme.colors['midnight-100']
          : theme.colors.border,
  }),
}));
