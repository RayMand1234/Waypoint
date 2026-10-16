import type { Href } from 'expo-router';
import { stepNumber, type StepKey } from './steps';

/** The screen for one step of one trip. Built steps have their own route; the rest share a placeholder. */
export const stepHref = (tripId: string, step: StepKey): Href => {
  switch (step) {
    case 'style':
      return { pathname: '/trip/[id]/style', params: { id: tripId } };
    case 'destination':
      return { pathname: '/trip/[id]/destination', params: { id: tripId } };
    case 'spots':
      return { pathname: '/trip/[id]/spots', params: { id: tripId } };
    case 'stay':
      return { pathname: '/trip/[id]/stay', params: { id: tripId } };
    case 'flights':
    case 'plan':
    case 'summary':
    case 'booked':
      return { pathname: '/trip/[id]/[step]', params: { id: tripId, step } };
  }
};

/** The route moment after finishing `step` — it plays, then opens the next step. */
export const momentHref = (tripId: string, finished: StepKey): Href => ({
  pathname: '/trip/[id]/moment',
  params: { id: tripId, step: String(stepNumber(finished)) },
});
