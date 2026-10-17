import { useEffect, useState } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const OPEN_MS = 320;
const CLOSE_MS = 240;
const EASE = Easing.bezier(0.2, 0.9, 0.2, 1);
/** The contents fade in over the last part of the growth, and out over the first part of the shrink. */
const CONTENT_FROM = 0.55;
/** The glass shows from this far into the growth (and is gone by then while shrinking). */
const GLASS_FROM = 0.35;

/** Where the avatar sits on screen, from `measureInWindow`. */
export type Anchor = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * The avatar growing into the panel: from the avatar's own size and spot, its
 * right and top edges fixed, to the panel's width and its contents' height,
 * the circle's corners easing into the panel's. Stays mounted until it has
 * shrunk back. With reduce motion on, it switches at once.
 */
export const useBubbleMorph = (
  anchor: Anchor | null,
  panel: { readonly width: number; readonly radius: number },
  /** Once it has shrunk all the way back into the avatar. */
  onClosed: () => void,
) => {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const [shown, setShown] = useState<Anchor | null>(anchor);
  const isOpen = anchor !== null;

  // Keep the last anchor while shrinking; drop it once shrunk (at once with reduce motion).
  if (anchor !== null && anchor !== shown) setShown(anchor);

  if (anchor === null && shown !== null && reduceMotion) setShown(null);

  const finishClosing = (): void => {
    setShown(null);
    onClosed();
  };

  useEffect(() => {
    if (reduceMotion) {
      progress.value = isOpen ? 1 : 0;

      if (!isOpen) onClosed();

      return;
    }

    if (isOpen) {
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASE });

      return;
    }

    progress.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: EASE },
      (finished) => {
        if (finished === true) scheduleOnRN(finishClosing);
      },
    );
    // Runs on open and close only; `finishClosing` and `onClosed` are read when they happen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reduceMotion, progress]);

  const from = shown ?? { x: 0, y: 0, width: 0, height: 0 };

  const shapeStyle = useAnimatedStyle(() => {
    const height = Math.max(contentHeight.value, from.height);

    return {
      width: interpolate(progress.value, [0, 1], [from.width, panel.width]),
      height: interpolate(progress.value, [0, 1], [from.height, height]),
      borderRadius: interpolate(
        progress.value,
        [0, 1],
        [from.height / 2, panel.radius],
      ),
    };
  });
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [CONTENT_FROM, 1], [0, 1], 'clamp'),
  }));
  /** The avatar's own look (frosted, on the photo) gives way to the panel's. */
  const avatarFillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  /** The glass is gone before the panel is back to the avatar's size, so no pale ring shows round it. */
  const glassStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, GLASS_FROM], [0, 1], 'clamp'),
  }));

  return {
    /** The avatar's spot while shown; `null` once shrunk away. */
    anchor: shown,
    shapeStyle,
    contentStyle,
    avatarFillStyle,
    glassStyle,
    onContentHeight: (height: number) => {
      contentHeight.value = height;
    },
  };
};
