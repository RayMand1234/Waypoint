import { useMemo } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Svg, { Path } from 'react-native-svg';
import { useMomentMotion } from '../hooks/useMomentMotion';
import type {
  FinishedStep,
  MomentLabel as Label,
} from '../utils/momentContent';
import {
  momentLength,
  momentPath,
  momentPoints,
  type MomentLayout,
} from '../utils/momentGeometry';
import { MomentCheckpoint } from './MomentCheckpoint';
import { MomentLabel } from './MomentLabel';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const ROAD_DOTS = [0, 9];

type MomentMapProps = {
  readonly layout: MomentLayout;
  readonly height: number;
  readonly step: FinishedStep;
  readonly labels: readonly Label[];
  readonly reduceMotion: boolean;
};

/** The whole trip as a road down the screen: done checkpoints, the trail drawing on, the marker gliding. */
export const MomentMap = ({
  layout,
  height,
  step,
  labels,
  reduceMotion,
}: MomentMapProps) => {
  const { theme } = useUnistyles();
  const points = useMemo(() => momentPoints(layout), [layout]);
  const d = useMemo(() => momentPath(points), [points]);
  const length = useMemo(() => momentLength(points), [points]);
  const motion = useMomentMotion(points, step, length, reduceMotion);

  return (
    <View
      style={styles.map}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={layout.width} height={height} style={styles.svg}>
        <Path
          d={d}
          fill="none"
          stroke={theme.colors['moment-road']}
          strokeWidth={theme.size['moment-road-stroke']}
          strokeLinecap="round"
          strokeDasharray={ROAD_DOTS}
        />
        <AnimatedPath
          d={d}
          fill="none"
          stroke={theme.colors['sunshine-400']}
          strokeWidth={theme.size['moment-trail-stroke']}
          strokeLinecap="round"
          strokeDasharray={[length, length]}
          animatedProps={motion.trailProps}
        />
      </Svg>
      {points.map((point, index) => {
        const label = labels[index];

        return label === undefined ? null : (
          <View key={index} style={styles.fill} pointerEvents="none">
            <MomentCheckpoint state={label.state} point={point} />
            <MomentLabel
              label={label}
              point={point}
              side={index % 2 === 0 ? 'left' : 'right'}
            />
          </View>
        );
      })}
      <Animated.View
        style={[styles.marker, motion.markerStyle]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.pulse, motion.pulseStyle]} />
        <View style={styles.markerDot} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  map: {
    flex: 1,
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: theme.size['moment-marker'],
    height: theme.size['moment-marker'],
  },
  pulse: {
    position: 'absolute',
    width: theme.size['moment-marker'],
    height: theme.size['moment-marker'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['sunshine-400'],
  },
  markerDot: {
    width: theme.size['moment-marker'],
    height: theme.size['moment-marker'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['sunshine-400'],
    borderWidth: theme.size['moment-marker-border'],
    borderColor: theme.colors['on-midnight'],
  },
}));
