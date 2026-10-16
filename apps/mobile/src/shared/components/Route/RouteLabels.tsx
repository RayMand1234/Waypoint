import { Pressable } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import type { ViewStyle } from 'react-native';
import {
  FIRST_LABEL_LEFT,
  NOW_LABEL_RISE,
  type Point,
} from '../../utils/routeGeometry';
import { Text } from '../Text';

type RouteLabelsProps = {
  readonly points: readonly Point[];
  readonly step: number;
  readonly stepName: string;
  /** What the traveler picked at each passed checkpoint, in order. */
  readonly picks: readonly string[];
  readonly nowStyle: AnimatedStyle<ViewStyle>;
  readonly onCheckpointPress?: (step: number) => void;
};

/** The picks under passed checkpoints (tappable to go back) and the step name above the current one. */
export const RouteLabels = ({
  points,
  step,
  stepName,
  picks,
  nowStyle,
  onCheckpointPress,
}: RouteLabelsProps) => {
  const current = points[step - 1];

  return (
    <>
      {picks.slice(0, step - 1).map((pick, index) => {
        const point = points[index];

        if (point === undefined) return null;

        return (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`Back to step ${String(index + 1)}: ${pick}`}
            disabled={onCheckpointPress === undefined}
            onPress={() => onCheckpointPress?.(index + 1)}
            style={styles.pick(
              index === 0 ? FIRST_LABEL_LEFT : point.x,
              index === 0,
            )}
          >
            <Text
              variant="route-label"
              color="ink-muted"
              numberOfLines={1}
              align={index === 0 ? 'left' : 'center'}
            >
              {pick}
            </Text>
          </Pressable>
        );
      })}
      {current !== undefined && (
        <Animated.View
          style={[styles.now(current), nowStyle]}
          pointerEvents="none"
        >
          <Text variant="route-now" numberOfLines={1} align="center">
            {stepName}
          </Text>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  pick: (x: number, isFirst: boolean) => ({
    position: 'absolute',
    top: theme.size['route-h'] - theme.space[4],
    left: isFirst ? x : x - theme.size['route-label-w'] / 2,
    width: isFirst ? undefined : theme.size['route-label-w'],
    minHeight: theme.space[4],
  }),
  now: (point: Point) => ({
    position: 'absolute',
    top: point.y - NOW_LABEL_RISE,
    left: point.x - theme.size['route-now-w'] / 2,
    width: theme.size['route-now-w'],
  }),
}));
