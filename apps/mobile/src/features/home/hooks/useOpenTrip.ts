import { assertNever } from '@waypoint/contracts/common';
import type { TripListItem } from '@waypoint/contracts/trips';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { stepHref } from '@/features/trip-flow';
import type { TripTarget } from '../utils/tripCardModel';

/** Tapping a trip: resume its step, or start a new draft from a past one. */
export const useOpenTrip = (planAgain: (trip: TripListItem) => void) =>
  useCallback(
    (trip: TripListItem, target: TripTarget): void => {
      switch (target.kind) {
        case 'step':
          router.push(stepHref(trip.id, target.step));

          return;
        case 'plan-again':
          planAgain(trip);

          return;
        default:
          assertNever(target);
      }
    },
    [planAgain],
  );
