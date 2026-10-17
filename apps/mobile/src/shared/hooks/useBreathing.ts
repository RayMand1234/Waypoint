import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BREATH_MS = 1600;
const BREATH_SCALE = 1.3;
const BREATH_LOW_OPACITY = 0.45;

/**
 * A slow, endless breath — grows a little and fades, then back — as an
 * animated style, for something waiting to be tapped. With reduce motion on it
 * stays still.
 */
export const useBreathing = () => {
  const reduceMotion = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    breath.value = withRepeat(
      withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [reduceMotion, breath]);

  return useAnimatedStyle(() => ({
    opacity: 1 - (1 - BREATH_LOW_OPACITY) * breath.value,
    transform: [{ scale: 1 + (BREATH_SCALE - 1) * breath.value }],
  }));
};
