const MORNING_FROM = 5;
const AFTERNOON_FROM = 12;
const EVENING_FROM = 18;

/** "Good morning" / "Good afternoon" / "Good evening" for the traveler's local hour. */
export const greetingFor = (hour: number): string => {
  if (hour >= MORNING_FROM && hour < AFTERNOON_FROM) return 'Good morning';

  if (hour >= AFTERNOON_FROM && hour < EVENING_FROM) return 'Good afternoon';

  return 'Good evening';
};

const firstName = (name: string | null): string | undefined => {
  const first = name?.trim().split(/\s+/)[0];

  return first === '' ? undefined : first;
};

/** "Hi, Ray" from "Ray Mandel"; "Hi there" before the traveler has a name. */
export const hiLine = (name: string | null): string => {
  const first = firstName(name);

  return first === undefined ? 'Hi there' : `Hi, ${first}`;
};

/** "Good evening, Ray"; just "Good evening" before the traveler has a name. */
export const greetingLine = (greeting: string, name: string | null): string => {
  const first = firstName(name);

  return first === undefined ? greeting : `${greeting}, ${first}`;
};

/** The avatar letter: the name's first letter, else the email's. */
export const initialOf = (
  name: string | null,
  email: string | undefined,
): string => (name?.trim()[0] ?? email?.[0] ?? '?').toUpperCase();
