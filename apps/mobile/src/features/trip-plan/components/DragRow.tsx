import type { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { DayDrag } from '../hooks/useDayDrag';

/**
 * A timeline row whose card can be dragged: measured for the drop position,
 * and raised above the other rows while its card is lifted.
 */
export const DragRow = ({
  dragKey,
  index,
  drag,
  children,
}: {
  readonly dragKey: string;
  /** Its place among the day's draggable stops. */
  readonly index: number;
  readonly drag: DayDrag;
  readonly children: ReactNode;
}) => {
  const { activeIndex } = drag;
  const raised = useAnimatedStyle(() => ({
    zIndex: activeIndex.get() === index ? 1 : 0,
  }));

  return (
    <Animated.View
      onLayout={(event) => {
        drag.layout(dragKey, event);
      }}
      style={raised}
    >
      {children}
    </Animated.View>
  );
};
