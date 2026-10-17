import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { useBreathing } from '../../hooks/useBreathing';
import type { Point } from '../../utils/routeGeometry';

type RouteCheckpointsProps = {
  readonly points: readonly Point[];
  readonly step: number;
  /** What the traveler picked at each passed checkpoint, for screen readers. */
  readonly picks: readonly string[];
  readonly onPress: (step: number) => void;
};

/**
 * The passed checkpoints as buttons back to their steps: a solid dot with a
 * soft halo that breathes, so they read as alive and tappable; pressed, the
 * halo darkens.
 */
export const RouteCheckpoints = ({
  points,
  step,
  picks,
  onPress,
}: RouteCheckpointsProps) => {
  const breathing = useBreathing();

  return (
    <>
      {points.slice(0, step - 1).map((point, index) => (
        <Pressable
          key={index}
          accessibilityRole="button"
          accessibilityLabel={`Back to step ${String(index + 1)}: ${picks[index] ?? ''}`}
          onPress={() => {
            onPress(index + 1);
          }}
          style={styles.button(point)}
        >
          {({ pressed }) => (
            <>
              <Animated.View
                style={[styles.halo, pressed ? styles.haloPressed : breathing]}
              />
              <View style={styles.dot} />
            </>
          )}
        </Pressable>
      ))}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: (point: Point) => ({
    position: 'absolute',
    left: point.x - theme.size['tap-min'] / 2,
    top: point.y - theme.size['tap-min'] / 2,
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  }),
  halo: {
    position: 'absolute',
    width: theme.size['route-cp-halo'],
    height: theme.size['route-cp-halo'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['midnight-100'],
  },
  haloPressed: {
    backgroundColor: theme.colors['midnight-700'],
    opacity: theme.opacity.disabled,
  },
  dot: {
    width: theme.size['route-cp-dot'],
    height: theme.size['route-cp-dot'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['midnight-900'],
    borderWidth: theme.size['route-cp-dot-border'],
    borderColor: theme.colors['surface-card'],
  },
}));
