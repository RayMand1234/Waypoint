import { router } from 'expo-router';
import { useCallback } from 'react';
import { momentHref, stepHref } from '../utils/stepHref';
import { stepKeySchema, type StepKey } from '../utils/steps';

/** Moving through the flow: on to a step, through the route moment, back one or to any passed step, or out to Home (the draft stays saved). */
export const useStepNavigation = (tripId: string) => ({
  /** After a step is saved: the route moment plays, then opens the next step. */
  finish: useCallback(
    (step: StepKey) => {
      router.push(momentHref(tripId, step));
    },
    [tripId],
  ),
  goTo: useCallback(
    (step: StepKey) => {
      router.push(stepHref(tripId, step));
    },
    [tripId],
  ),
  /**
   * Back to passed step `step` (1-based, as the Route numbers them): the
   * screens after it close, or it replaces this one if it isn't open.
   */
  jumpBack: useCallback(
    (step: number) => {
      const key = stepKeySchema.options[step - 1];

      if (key !== undefined) router.dismissTo(stepHref(tripId, key));
    },
    [tripId],
  ),
  back: useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []),
  close: useCallback(() => {
    router.dismissTo('/');
  }, []),
});
