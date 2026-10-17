import type { Photo } from '@waypoint/contracts/destinations';
import type { TripListItem } from '@waypoint/contracts/trips';
import { assertNever } from '@waypoint/contracts/common';
import {
  completedSteps,
  currentStep,
  PLANNING_STEP_COUNT,
  STEP_NAMES,
  type StepKey,
} from '@/features/trip-flow';
import { formatDateRange, formatTravelers } from '@/shared/utils/format';
import { capitalised, listOf } from '@/shared/utils/text';

/** What tapping a trip does. */
export type TripTarget =
  | { readonly kind: 'step'; readonly step: StepKey }
  | { readonly kind: 'plan-again' };

/** Everything a trip postcard shows, already worded. */
export type TripCardModel = {
  readonly id: string;
  readonly title: string;
  /** Three letters on the card (and on the photo's stand-in); `null` before a destination is picked. */
  readonly code: string | null;
  readonly photo: Photo | null;
  readonly tone: 'draft' | 'ready' | 'past';
  /** The status pill: "Draft", "Ready to book", "Booked". */
  readonly pill: string;
  readonly line: string;
  /** Planning steps done (drafts only). */
  readonly progress: number | null;
  readonly action: { readonly text: string; readonly isLink: boolean };
  readonly target: TripTarget;
  /** Only a draft can be deleted from Home. */
  readonly canDelete: boolean;
  /** The whole card for a screen reader. */
  readonly label: string;
};

const CODE_LENGTH = 3;

const travelerCount = (trip: TripListItem): number =>
  trip.adults + trip.childrenAges.length;

const datesLine = (trip: TripListItem): string =>
  trip.startDate === null || trip.endDate === null
    ? 'Dates not set'
    : formatDateRange(trip.startDate, trip.endDate);

/** "Flight, stay and 4-day plan ready" — only the parts that exist. */
const readyLine = (trip: TripListItem): string => {
  const parts = [
    ...(trip.selections.includes('flight') ? ['flight'] : []),
    ...(trip.selections.includes('stay') ? ['stay'] : []),
    ...(trip.planDays > 0 ? [`${String(trip.planDays)}-day plan`] : []),
  ];

  if (parts.length === 0) return 'Ready to book';

  return `${capitalised(listOf(parts))} ready`;
};

const statusParts = (
  trip: TripListItem,
): Pick<TripCardModel, 'tone' | 'pill' | 'progress' | 'action' | 'target'> => {
  switch (trip.status) {
    case 'draft': {
      const step = currentStep(trip);

      return {
        tone: 'draft',
        pill: 'Draft',
        progress: completedSteps(step),
        action: { text: `Continue · ${STEP_NAMES[step]}`, isLink: true },
        target: { kind: 'step', step },
      };
    }
    case 'planned':
      return {
        tone: 'ready',
        pill: 'Ready to book',
        progress: null,
        action: { text: 'Go to booking', isLink: true },
        target: { kind: 'step', step: 'booked' },
      };
    case 'booked':
      return {
        tone: 'ready',
        pill: 'Booked',
        progress: null,
        action: { text: readyLine(trip), isLink: false },
        target: { kind: 'step', step: 'booked' },
      };
    case 'past':
      return {
        tone: 'past',
        pill: 'Past',
        progress: null,
        action: { text: 'Plan it again', isLink: true },
        target: { kind: 'plan-again' },
      };
    default:
      return assertNever(trip.status);
  }
};

/** "Lisbon, 16–20 Nov · 2 travelers, draft, 4 of 6 steps. Continue · Flights." */
const labelOf = (
  card: Pick<TripCardModel, 'title' | 'line' | 'pill' | 'progress' | 'action'>,
): string =>
  [
    card.title,
    card.line,
    card.pill.toLowerCase(),
    ...(card.progress === null
      ? []
      : [`${String(card.progress)} of ${String(PLANNING_STEP_COUNT)} steps`]),
  ].join(', ') + `. ${card.action.text}.`;

export const toTripCard = (trip: TripListItem): TripCardModel => {
  const card = {
    id: trip.id,
    title: trip.destinationName ?? 'New waypoint',
    code:
      trip.destinationName === null
        ? null
        : trip.destinationName.slice(0, CODE_LENGTH).toUpperCase(),
    photo: trip.destinationPhoto,
    line: `${datesLine(trip)} · ${formatTravelers(travelerCount(trip))}`,
    ...statusParts(trip),
    canDelete: trip.status === 'draft',
  };

  return { ...card, label: labelOf(card) };
};

/** Home's two places for trips: the postcard rail (still to come) and the been-there stamps. */
export const splitTrips = (
  trips: readonly TripListItem[],
): {
  readonly upcoming: readonly TripListItem[];
  readonly past: readonly TripListItem[];
} => ({
  upcoming: trips.filter((trip) => trip.status !== 'past'),
  past: trips.filter((trip) => trip.status === 'past'),
});
