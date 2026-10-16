import type { TripListItem } from '@waypoint/contracts/trips';
import { z } from 'zod';
import { PLANNING_STEP_COUNT } from '@/shared/constants/planning';

/**
 * The six planning steps, then the summary and the booked end state. Order
 * matters: the stay comes right after the spots so it can sit among them,
 * and the day plan comes last, starting each day from the stay.
 */
export const stepKeySchema = z.enum([
  'style',
  'destination',
  'spots',
  'stay',
  'flights',
  'plan',
  'summary',
  'booked',
]);
export type StepKey = z.infer<typeof stepKeySchema>;

export const STEP_NAMES: Readonly<Record<StepKey, string>> = {
  style: 'Trip style',
  destination: 'Destination',
  spots: 'Spots & dates',
  stay: 'Stay',
  flights: 'Flights',
  plan: 'Day plan',
  summary: 'Summary',
  booked: 'Trip planned',
};

export { PLANNING_STEP_COUNT };

/** 1-based position on the Route (summary and booked sit past the last step). */
export const stepNumber = (step: StepKey): number =>
  stepKeySchema.options.indexOf(step) + 1;

/** How many of the six planning steps are done when the traveler is at `step`. */
export const completedSteps = (step: StepKey): number =>
  Math.min(stepNumber(step) - 1, PLANNING_STEP_COUNT);

type StepInput = Pick<
  TripListItem,
  | 'styles'
  | 'destinationId'
  | 'startDate'
  | 'endDate'
  | 'planDays'
  | 'selections'
>;

/** Where a draft resumes: the first step whose pick is still missing. */
export const currentStep = (trip: StepInput): StepKey => {
  if (trip.styles.length === 0) return 'style';

  if (trip.destinationId === null) return 'destination';

  if (trip.startDate === null || trip.endDate === null) return 'spots';

  if (!trip.selections.includes('stay')) return 'stay';

  if (!trip.selections.includes('flight')) return 'flights';

  if (trip.planDays === 0) return 'plan';

  return 'summary';
};
