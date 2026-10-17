import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useMe, type Anchor } from '@/features/profile';
import { stepHref } from '@/features/trip-flow';
import { useSession } from '@/shared/auth';
import { errorMessage } from '@/shared/utils/errorMessage';
import { greetingLine, initialOf } from '../utils/greeting';
import { heroBackdrop } from '../utils/heroBackdrop';
import {
  inspirationLine,
  inspirationTitle,
  stylesToSuggest,
} from '../utils/inspiration';
import { toStamp } from '../utils/stampModel';
import { splitTrips, toTripCard } from '../utils/tripCardModel';
import { useDeleteTrip } from './useDeleteTrip';
import { useGreeting } from './useGreeting';
import { useHeroStatusBar } from './useHeroStatusBar';
import { useInspiration } from './useInspiration';
import { useOpenTrip } from './useOpenTrip';
import { useStartPlanning } from './useStartPlanning';
import { useTrips } from './useTrips';

/** Everything Home shows and does: the hero, the trips rail, places worth the trip and past trips. */
export const useHome = () => {
  const greeting = useGreeting();
  const me = useMe();
  const session = useSession();
  const trips = useTrips();
  const deleting = useDeleteTrip();
  const planning = useStartPlanning();
  const openTrip = useOpenTrip(planning.planAgain);
  const all = useMemo(() => trips.data ?? [], [trips.data]);
  const { upcoming, past } = useMemo(() => splitTrips(all), [all]);
  const styles = useMemo(() => stylesToSuggest(all), [all]);
  const places = useInspiration(styles);
  const name = me.data?.name ?? null;
  const email =
    session.status === 'signed-in' ? session.session.user.email : undefined;

  const statusBar = useHeroStatusBar();
  // Where the avatar was tapped, while the profile is open.
  const [profileAt, setProfileAt] = useState<Anchor | null>(null);
  // Still showing (open, or shrinking back) — the hero's avatar stays hidden till it's done.
  const [isProfileShown, setProfileShown] = useState(false);

  return {
    hero: {
      greeting: greetingLine(greeting, name),
      initial: initialOf(name, email),
      backdrop: heroBackdrop(upcoming, places),
      tripsNote: trips.isPending
        ? ''
        : upcoming.length === 0
          ? 'Your first trip is one tap away'
          : `${String(upcoming.length)} in progress`,
    },
    cards: upcoming.map(toTripCard),
    stamps: past.map(toStamp),
    trips: {
      isLoading: trips.isPending,
      error: trips.isError ? errorMessage(trips.error) : undefined,
      retry: () => void trips.refetch(),
    },
    inspiration: {
      title: inspirationTitle(new Date().getMonth()),
      line: inspirationLine(styles),
      places,
    },
    planning,
    /** Keeps the status bar readable as the hero scrolls away. */
    onScroll: statusBar.onScroll,
    deleteError:
      deleting.error === undefined
        ? undefined
        : `We couldn't delete that draft. ${deleting.error}`,
    open: (tripId: string) => {
      const trip = upcoming.find((item) => item.id === tripId);

      if (trip !== undefined) openTrip(trip, toTripCard(trip).target);
    },
    remove: (tripId: string) => {
      const trip = upcoming.find((item) => item.id === tripId);

      if (trip !== undefined)
        deleting.askToDelete(trip.id, toTripCard(trip).title);
    },
    /** A past trip opens on its summary. */
    openPast: (tripId: string) => {
      router.push(stepHref(tripId, 'summary'));
    },
    startAt: (place: DestinationSuggestion) => {
      planning.startAt(place);
    },
    profile: {
      anchor: profileAt,
      isShown: isProfileShown,
      open: (anchor: Anchor) => {
        setProfileShown(true);
        setProfileAt(anchor);
      },
      close: () => {
        setProfileAt(null);
      },
      closed: () => {
        setProfileShown(false);
      },
    },
    goToExplore: () => {
      router.navigate('/explore');
    },
  };
};
