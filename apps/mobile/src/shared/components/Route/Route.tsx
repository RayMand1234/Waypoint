import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useRouteMotion } from '../../hooks/useRouteMotion';
import { checkpoints, roadLength, roadPath } from '../../utils/routeGeometry';
import { RouteLabels } from './RouteLabels';
import { RouteMarker } from './RouteMarker';
import { RouteRoad } from './RouteRoad';
import { componentSize } from '@/theme/tokens';
import { PLANNING_STEP_COUNT } from '../../constants/planning';

export type RouteProps = {
  /** 1–6. */
  readonly step: number;
  /** The current step's name: "Day plan". */
  readonly stepName: string;
  /** One or two words per passed step: "Views +2", "Lisbon", "5 days". */
  readonly picks: readonly string[];
  /** Jump back to a passed step. */
  readonly onCheckpointPress?: (step: number) => void;
};

/** Waypoint's progress: a winding road with seven checkpoints. Never a timer or "time left". */
export const Route = ({
  step,
  stepName,
  picks,
  onCheckpointPress,
}: RouteProps) => {
  const [width, setWidth] = useState<number>(componentSize['route-initial-w']);
  const points = useMemo(() => checkpoints(width), [width]);
  const d = useMemo(() => roadPath(points), [points]);
  const length = useMemo(() => roadLength(points), [points]);
  const motion = useRouteMotion(points, step, length);

  const onLayout = (event: LayoutChangeEvent): void => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${String(step)} of ${String(PLANNING_STEP_COUNT)}, ${stepName}`}
      accessibilityValue={{ min: 1, max: PLANNING_STEP_COUNT, now: step }}
      onLayout={onLayout}
      style={styles.route}
    >
      <RouteRoad
        width={width}
        points={points}
        d={d}
        roadLength={length}
        step={step}
        trailProps={motion.trailProps}
      />
      <RouteMarker
        markerStyle={motion.markerStyle}
        pulseStyle={motion.pulseStyle}
      />
      <RouteLabels
        points={points}
        step={step}
        stepName={stepName}
        picks={picks}
        nowStyle={motion.nowStyle}
        {...(onCheckpointPress === undefined ? {} : { onCheckpointPress })}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  route: {
    height: theme.size['route-h'],
    alignSelf: 'stretch',
  },
}));
