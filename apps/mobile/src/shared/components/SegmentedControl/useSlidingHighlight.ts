import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SWEEP_MS = 240;
const EASE = Easing.bezier(0.2, 0.9, 0.2, 1);

/**
 * The highlight behind the chosen option, sweeping from one option to the
 * next instead of jumping. Sized from the track's measured width; hidden when
 * no option is chosen. With reduce motion on it moves at once.
 */
export const useSlidingHighlight = (
  index: number,
  count: number,
  { padding, gap }: { readonly padding: number; readonly gap: number },
) => {
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const segmentWidth =
    count === 0 ? 0 : (trackWidth - padding * 2 - gap * (count - 1)) / count;
  const offset = useSharedValue(0);
  const isPlaced = useRef(false);
  const isShown = index >= 0 && trackWidth > 0;

  useEffect(() => {
    if (!isShown) return;

    const target = index * (segmentWidth + gap);

    // The first placement (and every move with reduce motion) is instant.
    offset.value =
      reduceMotion || !isPlaced.current
        ? target
        : withTiming(target, { duration: SWEEP_MS, easing: EASE });
    isPlaced.current = true;
  }, [index, isShown, segmentWidth, gap, reduceMotion, offset]);

  const highlightStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    opacity: isShown ? 1 : 0,
    transform: [{ translateX: offset.value }],
  }));

  return {
    highlightStyle,
    onTrackLayout: (event: LayoutChangeEvent) => {
      setTrackWidth(event.nativeEvent.layout.width);
    },
  };
};
