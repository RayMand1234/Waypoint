import { assertNever } from '@waypoint/contracts/common';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Svg, { Circle, Path } from 'react-native-svg';
import { componentSize } from '@/theme/tokens';
import type { useRouteMotion } from '../../hooks/useRouteMotion';
import type { Point } from '../../utils/routeGeometry';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Dotted road: zero-length dashes with round caps draw dots 7pt apart. */
const ROAD_DOTS = [0, 7];
const ROAD_STROKE = 2;
const TRAIL_STROKE = 3;
const CHECKPOINT_STROKE = 2;

type CheckpointState = 'done' | 'current' | 'next';
type Theme = ReturnType<typeof useUnistyles>['theme'];

const stateOf = (index: number, step: number): CheckpointState =>
  index < step - 1 ? 'done' : index === step - 1 ? 'current' : 'next';

/** Done: solid midnight. Current: white with a midnight ring. Next: surface with a grey ring. The finish is larger. */
const checkpointLook = (
  state: CheckpointState,
  isFinish: boolean,
  theme: Theme,
) => {
  const radius = isFinish
    ? componentSize['route-finish']
    : state === 'current'
      ? componentSize['route-checkpoint-current']
      : componentSize['route-checkpoint'];

  switch (state) {
    case 'done':
      return {
        r: radius,
        fill: theme.colors['midnight-900'],
        stroke: 'none',
        strokeWidth: 0,
      };
    case 'current':
      return {
        r: radius,
        fill: theme.colors['surface-card'],
        stroke: theme.colors['midnight-900'],
        strokeWidth: CHECKPOINT_STROKE,
      };
    case 'next':
      return {
        r: radius,
        fill: theme.colors.surface,
        stroke: theme.colors['border-strong'],
        strokeWidth: CHECKPOINT_STROKE,
      };
    default:
      return assertNever(state);
  }
};

type RouteRoadProps = {
  readonly width: number;
  readonly points: readonly Point[];
  readonly d: string;
  readonly roadLength: number;
  /** 1–6: checkpoints before it are done, it is current, the rest are next. */
  readonly step: number;
  readonly trailProps: ReturnType<typeof useRouteMotion>['trailProps'];
};

/** The SVG layer: dotted road, the solid trail travelled so far, and the checkpoints. */
export const RouteRoad = ({
  width,
  points,
  d,
  roadLength,
  step,
  trailProps,
}: RouteRoadProps) => {
  const { theme } = useUnistyles();
  const finish = points.at(-1);

  return (
    <Svg
      width={width}
      height={theme.size['route-h']}
      style={styles.svg}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={d}
        fill="none"
        stroke={theme.colors['border-strong']}
        strokeWidth={ROAD_STROKE}
        strokeLinecap="round"
        strokeDasharray={ROAD_DOTS}
      />
      <AnimatedPath
        d={d}
        fill="none"
        stroke={theme.colors['midnight-900']}
        strokeWidth={TRAIL_STROKE}
        strokeLinecap="round"
        strokeDasharray={[roadLength, roadLength]}
        animatedProps={trailProps}
      />
      {points.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          {...checkpointLook(
            stateOf(index, step),
            index === points.length - 1,
            theme,
          )}
        />
      ))}
      {finish !== undefined && (
        <Circle
          cx={finish.x}
          cy={finish.y}
          r={componentSize['route-finish-dot']}
          fill={theme.colors['border-strong']}
        />
      )}
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'visible',
  },
});
