import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
} from 'react-native-reanimated';

type AppearOptions = {
  readonly delayMs?: number;
  readonly durationMs: number;
  /** Rises this far into place. */
  readonly fromY?: number;
  /** Grows from this scale. */
  readonly fromScale?: number;
  readonly easing?: EasingFunction | EasingFunctionFactory;
  /** Hidden until true, then appears. Defaults to shown. */
  readonly isShown?: boolean;
  /** False shows it in place with no motion. */
  readonly isAnimated?: boolean;
};

/**
 * A view fading (and rising or growing) into place, as an animated style.
 * The view stays mounted throughout — layout animations (`entering`) that
 * mount views mid-transition crash Fabric's mounting on iOS. With reduce
 * motion it simply shows.
 */
export const useAppear = ({
  delayMs = 0,
  durationMs,
  fromY = 0,
  fromScale = 1,
  easing = Easing.out(Easing.cubic),
  isShown = true,
  isAnimated = true,
}: AppearOptions) => {
  const reduceMotion = useReducedMotion();
  const animates = isAnimated && !reduceMotion;
  const progress = useSharedValue(isShown && !animates ? 1 : 0);

  useEffect(() => {
    if (!isShown) {
      progress.value = 0;

      return;
    }

    progress.value = animates
      ? withDelay(delayMs, withTiming(1, { duration: durationMs, easing }))
      : 1;
  }, [isShown, animates, delayMs, durationMs, easing, progress]);

  return useAnimatedStyle(() => ({
    opacity: Math.min(progress.value, 1),
    transform: [
      { translateY: fromY * (1 - progress.value) },
      { scale: fromScale + (1 - fromScale) * progress.value },
    ],
  }));
};
