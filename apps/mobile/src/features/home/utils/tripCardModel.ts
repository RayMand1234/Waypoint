import type { TripListItem } from '@waypoint/contracts/trips';
import { assertNever } from '@waypoint/contracts/common';
import {
  completedSteps,
  currentStep,
  STEP_NAMES,
  type StepKey,
} from '@/features/trip-flow';
import type { BadgeProps } from '@/shared/components';
import { formatDateRange, formatTravelers } from '@/shared/utils/format';
import { capitalised, listOf } from '@/shared/utils/text';

/** What tapping a trip does. */
export type TripTarget =
  | { readonly kind: 'step'; readonly step: StepKey }
  | { readonly kind: 'plan-again' };

/** Everything a trip row shows, already worded. */
export type TripCardModel = {
  readonly id: string;
  readonly title: string;
  /** Three letters on the thumbnail; `null` before a destination is picked. */
  readonly code: string | null;
  readonly tone: 'draft' | 'ready' | 'past';
  readonly line: string;
  readonly status:
    | { readonly kind: 'badge'; readonly badge: BadgeProps }
    | { readonly kind: 'text'; readonly text: string };
  /** Planning steps done (drafts only). */
  readonly progress: number | null;
  readonly action: { readonly text: string; readonly isLink: boolean };
  readonly target: TripTarget;
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
): Pick<
  TripCardModel,
  'tone' | 'status' | 'progress' | 'action' | 'target'
> => {
  switch (trip.status) {
    case 'draft': {
      const step = currentStep(trip);

      return {
        tone: 'draft',
        status: { kind: 'badge', badge: { kind: 'neutral', label: 'Draft' } },
        progress: completedSteps(step),
        action: { text: `Continue · ${STEP_NAMES[step]}`, isLink: true },
        target: { kind: 'step', step },
      };
    }
    case 'planned':
      return {
        tone: 'ready',
        status: { kind: 'badge', badge: { kind: 'neutral', label: 'Planned' } },
        progress: null,
        action: { text: 'Go to booking', isLink: true },
        target: { kind: 'step', step: 'booked' },
      };
    case 'booked':
      return {
        tone: 'ready',
        status: { kind: 'badge', badge: { kind: 'savings', label: 'Booked' } },
        progress: null,
        action: { text: readyLine(trip), isLink: false },
        target: { kind: 'step', step: 'booked' },
      };
    case 'past':
      return {
        tone: 'past',
        status: { kind: 'text', text: 'Past' },
        progress: null,
        action: { text: 'Plan it again', isLink: true },
        target: { kind: 'plan-again' },
      };
    default:
      return assertNever(trip.status);
  }
};

export const toTripCard = (trip: TripListItem): TripCardModel => ({
  id: trip.id,
  title: trip.destinationName ?? 'New waypoint',
  code:
    trip.destinationName === null
      ? null
      : trip.destinationName.slice(0, CODE_LENGTH).toUpperCase(),
  line: `${datesLine(trip)} · ${formatTravelers(travelerCount(trip))}`,
  ...statusParts(trip),
});
