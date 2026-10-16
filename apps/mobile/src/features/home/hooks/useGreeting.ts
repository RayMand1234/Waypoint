import { useMemo } from 'react';
import { greetingFor } from '../utils/greeting';

/** The greeting for the hour the screen opened. */
export const useGreeting = (): string =>
  useMemo(() => greetingFor(new Date().getHours()), []);
