import { router } from 'expo-router';
import { useCallback } from 'react';
import { momentHref, stepHref } from '../utils/stepHref';
import type { StepKey } from '../utils/steps';

/** Moving through the flow: on to a step, through the route moment, back one, or out to Home (the draft stays saved). */
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
  back: useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []),
  close: useCallback(() => {
    router.dismissTo('/');
  }, []),
});
