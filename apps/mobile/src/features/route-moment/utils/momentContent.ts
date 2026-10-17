import type { TripDetail } from '@waypoint/contracts/trips';
import {
  routePicks,
  STEP_NAMES,
  STYLE_SHORT_NAMES,
  type StepKey,
} from '@/features/trip-flow';
import { tripDays } from '@/shared/utils/dates';
import { capitalised, listOf, plural } from '@/shared/utils/text';

/** The step just finished: 1 (Trip style) … 6 (Day plan). */
export type FinishedStep = 1 | 2 | 3 | 4 | 5 | 6;

export const NEXT_STEP: Readonly<Record<FinishedStep, StepKey>> = {
  1: 'destination',
  2: 'spots',
  3: 'flights',
  4: 'stay',
  5: 'plan',
  6: 'summary',
};

export type MomentContent = {
  readonly title: string;
  readonly sheetTitle: string;
  readonly tasks: readonly [string, string, string];
  readonly go: string;
};

/** What the moment says after each step — the trip so far, and what we're doing next. */
export const momentContent = (
  step: FinishedStep,
  trip: TripDetail,
): MomentContent => {
  const destination = trip.destinationName ?? 'your destination';
  const days =
    trip.startDate === null || trip.endDate === null
      ? null
      : tripDays(trip.startDate, trip.endDate);

  switch (step) {
    case 1:
      return {
        title: `${capitalised(listOf(trip.styles.map((style) => STYLE_SHORT_NAMES[style].toLowerCase())))}.`,
        sheetTitle: 'Finding where to go',
        tasks: [
          'Matching destinations to your styles',
          'Checking typical stay prices',
          'Putting the best match first',
        ],
        go: 'Choose your destination',
      };
    case 2:
      return {
        title: `${destination} it is.`,
        sheetTitle: `Getting to know ${destination}`,
        tasks: [
          'Finding the top spots for you',
          'Checking opening hours and fees',
          'Ranking spots by your styles',
        ],
        go: 'Pick spots & dates',
      };
    case 3:
      return {
        title: `${days === null ? 'Your days' : plural(days, 'day')}, ${plural(trip.spots.length, 'spot')}.`,
        sheetTitle: 'Finding your flights',
        tasks: [
          `Searching flights that fit day 1 and ${String(days ?? 1)}`,
          'Weighing price against quality',
          'Including bags and fees',
        ],
        go: 'Choose your flight',
      };
    case 4:
      return {
        title: 'Your flight is set.',
        sheetTitle: 'Finding where to sleep',
        tasks: [
          'Finding the middle of your spots',
          'Looking for stays nearby',
          'Weighing price against location',
        ],
        go: 'Choose your stay',
      };
    case 5:
      return {
        title: 'Your stay is set.',
        sheetTitle: 'Building your day plan',
        tasks: [
          'Grouping spots by neighbourhood',
          'Starting each day from your stay',
          'Adding travel time between stops',
        ],
        go: 'See your plan',
      };
    case 6:
      return {
        title: 'Your days are set.',
        sheetTitle: 'Putting your trip together',
        tasks: [
          'Adding up flights, stay and tickets',
          'Comparing with average prices',
          'Re-checking availability',
        ],
        go: 'Review your trip',
      };
  }
};

export type CheckpointState = 'done' | 'just' | 'target' | 'todo' | 'finish';

export type MomentLabel = {
  readonly state: CheckpointState;
  readonly top: string;
  readonly main: string;
};

const NAMES = [
  ...(
    ['style', 'destination', 'spots', 'flights', 'stay', 'plan'] as const
  ).map((key) => STEP_NAMES[key]),
  'Book',
];

/** The state and wording beside each of the seven checkpoints. */
export const momentLabels = (
  step: FinishedStep,
  trip: TripDetail,
): MomentLabel[] => {
  const picks = routePicks(trip);

  return NAMES.map((name, k): MomentLabel => {
    if (k < step)
      return {
        state: k === step - 1 ? 'just' : 'done',
        top: name,
        main: picks[k] ?? '',
      };

    if (k === step) return { state: 'target', top: 'Next stop', main: name };

    return {
      state: k === NAMES.length - 1 ? 'finish' : 'todo',
      top: '',
      main: name,
    };
  });
};

/** `?step=` from the route, as a finished step; `undefined` when it isn't 1–6. */
export const parseFinishedStep = (
  value: string | undefined,
): FinishedStep | undefined => {
  const step = Number(value);

  return step === 1 ||
    step === 2 ||
    step === 3 ||
    step === 4 ||
    step === 5 ||
    step === 6
    ? step
    : undefined;
};
