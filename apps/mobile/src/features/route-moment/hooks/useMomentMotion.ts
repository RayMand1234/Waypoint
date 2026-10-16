import { useEffect } from 'react';
import {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { Point } from '@/shared/utils/bezier';
import { componentSize } from '@/theme/tokens';
import { checkpointFraction, momentPointAt } from '../utils/momentGeometry';
import type { FinishedStep } from '../utils/momentContent';

// Timing from route-moment.css: the trail draws and the marker glides for
// 1.4s after 0.6s; the marker then pulses every 1.8s from 2.1s.
const GLIDE_DELAY_MS = 600;
const GLIDE_MS = 1400;
const PULSE_DELAY_MS = 2100;
const PULSE_MS = 1800;
const GLIDE_EASING = Easing.bezier(0.45, 0, 0.2, 1);
const MARKER = componentSize['moment-marker'];
const PULSE_SCALE = (MARKER + 2 * componentSize['moment-pulse']) / MARKER;
const PULSE_START_OPACITY = 0.6;

/** The trail and marker moving from the finished checkpoint to the next one. */
export const useMomentMotion = (
  points: readonly Point[],
  step: FinishedStep,
  roadLength: number,
  reduceMotion: boolean,
) => {
  const from = checkpointFraction(step - 1);
  const to = checkpointFraction(step);
  const progress = useSharedValue(reduceMotion ? to : from);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = to;

      return;
    }

    progress.value = from;
    progress.value = withDelay(
      GLIDE_DELAY_MS,
      withTiming(to, { duration: GLIDE_MS, easing: GLIDE_EASING }),
    );
    pulse.value = withDelay(
      PULSE_DELAY_MS,
      withRepeat(
        withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [from, to, reduceMotion, progress, pulse]);

  const trailProps = useAnimatedProps(() => ({
    strokeDashoffset: roadLength * (1 - progress.value),
  }));

  const markerStyle = useAnimatedStyle(() => {
    const point = momentPointAt(points, progress.value);

    return {
      transform: [
        { translateX: point.x - MARKER / 2 },
        { translateY: point.y - MARKER / 2 },
      ],
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: PULSE_START_OPACITY * (1 - pulse.value),
    transform: [{ scale: 1 + (PULSE_SCALE - 1) * pulse.value }],
  }));

  return { trailProps, markerStyle, pulseStyle };
};
