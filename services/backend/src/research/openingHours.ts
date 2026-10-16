import { isoTimeSchema, type IsoTime } from '@waypoint/contracts/common';
import type {
  OpeningHours,
  OpeningPeriod,
} from '@waypoint/contracts/destinations';

// Reads the simple subset of OpenStreetMap's opening_hours syntax that covers
// most attractions: "Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off", "24/7",
// "Tu-Su 10:00-13:00,14:00-18:00". Anything richer (months, seasons, public
// holidays, dates) keeps only its text: a wrong schedule is worse than none.

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

const dayNumber = (token: string): number | undefined => {
  const index = DAYS.findIndex((day) => day === token);

  return index === -1 ? undefined : index + 1;
};

/** "Mo-Fr,Su" → [1, 2, 3, 4, 5, 7]; `undefined` when unreadable. */
const parseDays = (text: string): readonly number[] | undefined => {
  const parts = text.split(',').map((part) => {
    const [from, to] = part.split('-');
    const start = from === undefined ? undefined : dayNumber(from);
    const end = to === undefined ? start : dayNumber(to);

    if (start === undefined || end === undefined) return undefined;

    return start <= end
      ? ALL_DAYS.filter((day) => day >= start && day <= end)
      : ALL_DAYS.filter((day) => day >= start || day <= end);
  });

  return parts.some((part) => part === undefined)
    ? undefined
    : parts.flatMap((part) => part ?? []);
};

type Span = { readonly opens: IsoTime; readonly closes: IsoTime };

/** "10:00-13:00,14:00-18:00" → two spans; `undefined` when unreadable. */
const parseSpans = (text: string): readonly Span[] | undefined => {
  const spans = text.split(',').map((range) => {
    const match = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(range.trim());
    const opens = isoTimeSchema.safeParse(match?.[1]);
    const closes = isoTimeSchema.safeParse(
      match?.[2] === '24:00' ? '23:59' : match?.[2],
    );

    return opens.success && closes.success
      ? { opens: opens.data, closes: closes.data }
      : undefined;
  });

  return spans.some((span) => span === undefined)
    ? undefined
    : spans.flatMap((span) => span ?? []);
};

type Rule = {
  readonly days: readonly number[];
  readonly spans: readonly Span[];
};

const parseRule = (rule: string): Rule | undefined => {
  const trimmed = rule.trim();
  const match = /^(?:([A-Za-z,-]+)\s+)?(.+)$/.exec(trimmed);
  const dayText = match?.[1];
  const timeText = match?.[2];

  if (timeText === undefined) return undefined;

  const days = dayText === undefined ? ALL_DAYS : parseDays(dayText);

  if (days === undefined) return undefined;

  if (timeText === 'off' || timeText === 'closed') return { days, spans: [] };

  const spans = parseSpans(timeText);

  return spans === undefined ? undefined : { days, spans };
};

const toPeriods = (rules: readonly Rule[]): OpeningPeriod[] =>
  ALL_DAYS.flatMap((day) => {
    // In OpenStreetMap a later rule replaces earlier ones for the days it names.
    const rule = rules.findLast((candidate) => candidate.days.includes(day));

    return (rule?.spans ?? []).map((span) => ({
      day,
      opens: span.opens,
      closes: span.closes,
    }));
  });

const ALWAYS_OPEN = isoTimeSchema.parse('00:00');
const DAY_END = isoTimeSchema.parse('23:59');

/** Opening hours from an OpenStreetMap `opening_hours` value; `null` for an empty one. */
export const parseOpeningHours = (
  raw: string | undefined,
): OpeningHours | null => {
  const text = raw?.trim();

  if (text === undefined || text === '') return null;

  if (text === '24/7') {
    return {
      text,
      weekly: ALL_DAYS.map((day) => ({
        day,
        opens: ALWAYS_OPEN,
        closes: DAY_END,
      })),
    };
  }

  const rules = text.split(';').map(parseRule);

  return rules.some((rule) => rule === undefined)
    ? { text, weekly: null }
    : {
        text,
        weekly: toPeriods(
          rules.flatMap((rule) => (rule === undefined ? [] : [rule])),
        ),
      };
};
