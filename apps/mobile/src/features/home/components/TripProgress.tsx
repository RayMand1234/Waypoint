import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { PLANNING_STEP_COUNT } from '@/features/trip-flow';

type SegmentState = 'done' | 'current' | 'todo';

/**
 * Six segments for the planning steps. On a light card: done in midnight-900,
 * the current step in midnight-100, the rest empty (brand book). On a photo:
 * done in sunshine, the rest a faint white track.
 */
export const TripProgress = ({
  completed,
  onPhoto = false,
}: {
  readonly completed: number;
  readonly onPhoto?: boolean;
}) => {
  styles.useVariants({ onPhoto });

  return (
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
            index < completed
              ? 'done'
              : index === completed
                ? 'current'
                : 'todo',
          )}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.space[1],
    variants: {
      onPhoto: {
        true: {},
        false: { maxWidth: theme.size['progress-track-max'] },
      },
    },
  },
  segment: (state: SegmentState) => ({
    flex: 1,
    height: theme.size['progress-h'],
    borderRadius: theme.radius.full,
    variants: {
      onPhoto: {
        true: {
          backgroundColor:
            state === 'done'
              ? theme.colors['sunshine-400']
              : theme.colors['on-photo-track'],
        },
        false: {
          backgroundColor:
            state === 'done'
              ? theme.colors['midnight-900']
              : state === 'current'
                ? theme.colors['midnight-100']
                : theme.colors.border,
        },
      },
    },
  }),
}));
