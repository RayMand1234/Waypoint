import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStepNavigation } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import {
  dragKeysOf,
  groupingOf,
  moveItem,
  withDayOrder,
  withoutSpot,
  withSpotOn,
  withStopsOrdered,
} from '../utils/planEdits';
import { notPlanned } from '../utils/planModel';
import { useBuildPlan } from './useBuildPlan';
import { useDayDrag } from './useDayDrag';

/** Step 6: the plan, the day shown, the stop being edited or dragged, and the edits themselves. */
export const usePlanStep = (trip: TripDetail, spots: readonly Spot[]) => {
  const build = useBuildPlan(trip.id);
  const navigation = useStepNavigation(trip.id);
  const [shown, setShown] = useState(0);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const hasAsked = useRef(false);
  // A dragged day shows its new order at once, while the plan is re-timed.
  const [reordered, setReordered] = useState<
    { readonly date: string; readonly keys: readonly string[] } | undefined
  >(undefined);
  const grouping = groupingOf(trip.days);
  const savedDay = trip.days[Math.min(shown, trip.days.length - 1)];
  const day =
    savedDay !== undefined && reordered?.date === savedDay.date
      ? withStopsOrdered(savedDay, reordered.keys)
      : savedDay;
  /** The day's draggable stops in order: its spots, and lunch. */
  const dayKeys = useMemo(
    () => (day === undefined ? [] : dragKeysOf(day)),
    [day],
  );
  const spotsById = useMemo(
    () => new Map(spots.map((spot) => [spot.id, spot])),
    [spots],
  );

  // A trip that reaches this step without a plan (the route moment usually
  // builds it) gets one built once, as the step opens.
  useEffect(() => {
    if (trip.days.length > 0 || hasAsked.current) return;

    hasAsked.current = true;
    build.mutate({});
  }, [trip.days.length, build]);

  const rearrange = (next: typeof grouping): void => {
    setEditingId(undefined);
    build.mutate({ days: next });
  };
  const reorder = (keys: string[]): void => {
    if (day === undefined) return;

    setReordered({ date: day.date, keys });
    build.mutate(
      { days: withDayOrder(grouping, day.date, keys) },
      {
        onSettled: () => {
          setReordered(undefined);
        },
      },
    );
  };
  const dragging = useDayDrag(dayKeys, reorder);

  return {
    days: trip.days,
    day,
    shownIndex: Math.min(shown, Math.max(trip.days.length - 1, 0)),
    show: setShown,
    spotsById,
    notPlanned: notPlanned(trip),
    editing: day?.stops.find(
      (stop) => stop.spotId !== null && stop.spotId === editingId,
    ),
    edit: setEditingId,
    stopEditing: () => {
      setEditingId(undefined);
    },
    dayKeys,
    drag: dragging.drag,
    isDragging: dragging.isDragging,
    isBuilding: build.isPending,
    error: build.error === null ? undefined : errorMessage(build.error),
    navigation,
    remove: (spotId: string) => {
      rearrange(withoutSpot(grouping, spotId));
    },
    move: (spotId: string, date: string) => {
      rearrange(withSpotOn(grouping, spotId, date));
    },
    /** Back into the plan, on the day shown. */
    addBack: (spotId: string) => {
      if (day !== undefined) rearrange(withSpotOn(grouping, spotId, day.date));
    },
    /** One place earlier or later: the drag, for screen readers. */
    nudge: (key: string, by: -1 | 1) => {
      const from = dayKeys.indexOf(key);
      const to = from + by;

      if (from !== -1 && to >= 0 && to < dayKeys.length)
        reorder(moveItem(dayKeys, from, to));
    },
    rebuild: () => {
      build.mutate({});
    },
  };
};
