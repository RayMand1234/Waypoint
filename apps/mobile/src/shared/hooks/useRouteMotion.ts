import { useEffect } from 'react';
import {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { componentSize } from '@/theme/tokens';
import { fractionAt, pointAt, type Point } from '../utils/routeGeometry';

// Timings from the brand book's Motion section.
const GLIDE_MS = 900;
const GLIDE_DELAY_MS = 250;
const NOW_FADE_MS = 400;
const NOW_DELAY_MS = 1000;
const PULSE_MS = 2000;
const PULSE_DELAY_MS = 1400;
/** The pulse ring grows from the marker to a 10pt halo around it (brand book). */
const PULSE_HALO = 10;
const PULSE_SCALE =
  (componentSize['route-marker'] + 2 * PULSE_HALO) /
  componentSize['route-marker'];
const PULSE_START_OPACITY = 0.7;
const GLIDE_EASING = Easing.bezier(0.5, 0, 0.2, 1);
const HALF_MARKER = componentSize['route-marker'] / 2;

/**
 * The marker glides from the previous checkpoint to the current one while the
 * trail draws behind it, the step name fades in, then the marker pulses. With
 * reduce motion on, everything shows its end state at once.
 */
export const useRouteMotion = (
  points: readonly Point[],
  step: number,
  roadLength: number,
) => {
  const reduceMotion = useReducedMotion();
  const to = fractionAt(step - 1);
  // Step 1 has nowhere to glide from: the marker simply appears.
  const from = step <= 1 ? to : fractionAt(step - 2);
  const progress = useSharedValue(reduceMotion ? to : from);
  const nowOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = to;
      nowOpacity.value = 1;

      return;
    }

    progress.value = from;
    progress.value = withDelay(
      GLIDE_DELAY_MS,
      withTiming(to, { duration: GLIDE_MS, easing: GLIDE_EASING }),
    );
    nowOpacity.value = withDelay(
      NOW_DELAY_MS,
      withTiming(1, { duration: NOW_FADE_MS }),
    );
    pulse.value = withDelay(
      PULSE_DELAY_MS,
      withRepeat(withTiming(1, { duration: PULSE_MS }), -1, false),
    );
  }, [from, to, reduceMotion, progress, nowOpacity, pulse]);

  const markerStyle = useAnimatedStyle(() => {
    const point = pointAt(points, progress.value);

    return {
      transform: [
        { translateX: point.x - HALF_MARKER },
        { translateY: point.y - HALF_MARKER },
      ],
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: PULSE_START_OPACITY * (1 - pulse.value),
    transform: [{ scale: 1 + (PULSE_SCALE - 1) * pulse.value }],
  }));

  const nowStyle = useAnimatedStyle(() => ({ opacity: nowOpacity.value }));

  const trailProps = useAnimatedProps(() => ({
    strokeDashoffset: roadLength * (1 - progress.value),
  }));

  return { markerStyle, pulseStyle, nowStyle, trailProps };
};
