import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDetail } from '@waypoint/contracts/trips';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStepNavigation } from '@/features/trip-flow';
import { errorMessage } from '@/shared/utils/errorMessage';
import { groupingOf, withoutSpot, withSpotOn } from '../utils/planEdits';
import { notPlanned } from '../utils/planModel';
import { useBuildPlan } from './useBuildPlan';

/** Step 6: the plan, the day shown, the stop being edited, and the edits themselves. */
export const usePlanStep = (trip: TripDetail, spots: readonly Spot[]) => {
  const build = useBuildPlan(trip.id);
  const navigation = useStepNavigation(trip.id);
  const [shown, setShown] = useState(0);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const hasAsked = useRef(false);
  const grouping = groupingOf(trip.days);
  const day = trip.days[Math.min(shown, trip.days.length - 1)];
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
    rebuild: () => {
      build.mutate({});
    },
  };
};
