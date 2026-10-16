const MORNING_FROM = 5;
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;

/** "Good morning" / "Good afternoon" / "Good evening" for the traveler's local hour. */
export const greetingFor = (hour: number): string => {
  if (hour >= MORNING_FROM && hour < AFTERNOON_FROM) return 'Good morning';

  if (hour >= AFTERNOON_FROM && hour < EVENING_FROM) return 'Good afternoon';

  return 'Good evening';
};

/** "Hi, Ray" from "Ray Mandel"; "Hi there" before the traveler has a name. */
export const hiLine = (name: string | null): string => {
  const first = name?.trim().split(/\s+/)[0];

  return first === undefined || first === '' ? 'Hi there' : `Hi, ${first}`;
};

/** The avatar letter: the name's first letter, else the email's. */
export const initialOf = (
  name: string | null,
  email: string | undefined,
): string => (name?.trim()[0] ?? email?.[0] ?? '?').toUpperCase();
