import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import { moveItem } from '../utils/planEdits';

type RowBox = { readonly top: number; readonly bottom: number };

/** What each draggable row needs: the UI-thread values, and the JS callbacks it schedules. */
export type DayDrag = {
  /** Each draggable row's vertical centre, in day order. */
  readonly centers: SharedValue<number[]>;
  /** Each draggable row's bottom (where its card ends), in day order. */
  readonly bottoms: SharedValue<number[]>;
  /** The card being dragged, or -1. */
  readonly activeIndex: SharedValue<number>;
  /** Where it would land. */
  readonly target: SharedValue<number>;
  readonly translateY: SharedValue<number>;
  /** A card lifted: the screen stops scrolling. */
  readonly start: () => void;
  readonly drop: (from: number, to: number) => void;
  readonly layout: (key: string, event: LayoutChangeEvent) => void;
};

/**
 * Hold-and-drag reordering of one day's stops (its spots and lunch, by key):
 * where each row sits, which card is lifted and where it would land (the
 * others make room as it moves), and the new order on drop.
 */
export const useDayDrag = (
  keys: readonly string[],
  onReorder: (keys: string[]) => void,
): { readonly drag: DayDrag; readonly isDragging: boolean } => {
  const [boxes, setBoxes] = useState<ReadonlyMap<string, RowBox>>(new Map());
  const [isDragging, setDragging] = useState(false);
  const centers = useSharedValue<number[]>([]);
  const bottoms = useSharedValue<number[]>([]);
  const activeIndex = useSharedValue(-1);
  const target = useSharedValue(-1);
  const translateY = useSharedValue(0);
  // Set on a drop that reorders: the cards stay where they were dropped until
  // the new order has rendered, so nothing jumps back for a frame.
  const settling = useRef(false);

  const settle = useCallback(() => {
    activeIndex.set(-1);
    target.set(-1);
    translateY.set(0);
  }, [activeIndex, target, translateY]);

  useLayoutEffect(() => {
    const rows = keys.flatMap((key) => boxes.get(key) ?? []);

    centers.set(rows.map((row) => (row.top + row.bottom) / 2));
    bottoms.set(rows.map((row) => row.bottom));
  }, [keys, boxes, centers, bottoms]);

  useLayoutEffect(() => {
    if (!settling.current) return;

    settling.current = false;
    settle();
  }, [keys, settle]);

  const layout = useCallback(
    (key: string, { nativeEvent }: LayoutChangeEvent) => {
      const { y, height } = nativeEvent.layout;

      setBoxes((current) =>
        new Map(current).set(key, { top: y, bottom: y + height }),
      );
    },
    [],
  );

  return {
    drag: {
      centers,
      bottoms,
      activeIndex,
      target,
      translateY,
      start: () => {
        setDragging(true);
      },
      drop: (from, to) => {
        setDragging(false);

        if (to === from) {
          settle();

          return;
        }

        settling.current = true;
        onReorder(moveItem(keys, from, to));
      },
      layout,
    },
    isDragging,
  };
};
