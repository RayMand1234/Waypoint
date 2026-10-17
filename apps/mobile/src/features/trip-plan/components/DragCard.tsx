import type { ReactNode } from 'react';
import { View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { scheduleOnRN } from 'react-native-worklets';
import type { DayDrag } from '../hooks/useDayDrag';
import { dropIndex, makeRoomShift } from '../utils/dragOrder';

/** How long a card is held before it lifts (a quick swipe still scrolls). */
const HOLD_MS = 250;
const LIFTED_SCALE = 1.03;
const LIFT_MS = 120;
/** How fast the other cards slide to make room. */
const SHIFT_MS = 180;

/**
 * A stop's card that lifts when held and follows the finger until dropped;
 * its time and line stay put. While another card is dragged, it slides aside
 * to make room.
 */
export const DragCard = ({
  index,
  drag,
  children,
}: {
  /** Its place among the day's draggable stops. */
  readonly index: number;
  readonly drag: DayDrag;
  readonly children: ReactNode;
}) => {
  const { centers, bottoms, activeIndex, target, translateY, start, drop } =
    drag;
  const pan = usePanGesture({
    activateAfterLongPress: HOLD_MS,
    onActivate: () => {
      'worklet';
      activeIndex.set(index);
      target.set(index);
      translateY.set(0);
      scheduleOnRN(start);
    },
    onUpdate: (event) => {
      'worklet';
      translateY.set(event.translationY);

      target.set(dropIndex(centers.get(), index, event.translationY));
    },
    onFinalize: () => {
      'worklet';
      if (activeIndex.get() !== index) return;

      // The drop settles the cards once the new order has rendered.
      scheduleOnRN(drop, index, target.get());
    },
  });
  const lifted = useAnimatedStyle(() => {
    const from = activeIndex.get();
    const isLifted = from === index;
    // Settled cards snap: the new order has just rendered them in place.
    const offset =
      from < 0
        ? 0
        : withTiming(makeRoomShift(bottoms.get(), from, target.get(), index), {
            duration: SHIFT_MS,
          });

    return {
      transform: [
        { translateY: isLifted ? translateY.get() : offset },
        {
          scale: withTiming(isLifted ? LIFTED_SCALE : 1, {
            duration: LIFT_MS,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={[styles.card, lifted]}>
      <GestureDetector gesture={pan}>
        {/* A real view for the detector to attach to (a plain one is flattened away). */}
        <View collapsable={false}>{children}</View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
  },
});
