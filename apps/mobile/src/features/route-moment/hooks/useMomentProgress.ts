import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

// From the design (route-moment.css): the three tasks tick off at 1.1s, 1.8s
// and 2.5s, and Continue fades in at 2.9s.
const TASK_DONE_MS = [1100, 1800, 2500] as const;
const CONTINUE_MS = 2900;

/**
 * How many tasks show as done, and whether Continue may appear. The last task
 * — and Continue — also wait for the next step's data, so the moment covers a
 * real wait instead of adding one. With reduce motion there is no timeline,
 * only the wait for data.
 */
export const useMomentProgress = (isDataReady: boolean) => {
  const reduceMotion = useReducedMotion();
  const [elapsedDone, setElapsedDone] = useState(
    reduceMotion ? TASK_DONE_MS.length : 0,
  );
  const [isTimelineDone, setTimelineDone] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const timers = [
      ...TASK_DONE_MS.map((ms, index) =>
        setTimeout(() => {
          setElapsedDone(index + 1);
        }, ms),
      ),
      setTimeout(() => {
        setTimelineDone(true);
      }, CONTINUE_MS),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [reduceMotion]);

  return {
    tasksDone: isDataReady
      ? elapsedDone
      : Math.min(elapsedDone, TASK_DONE_MS.length - 1),
    canContinue: isTimelineDone && isDataReady,
    reduceMotion,
  };
};
