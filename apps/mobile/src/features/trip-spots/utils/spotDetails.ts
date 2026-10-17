import type { Fee, Spot, SpotCategory } from '@waypoint/contracts/destinations';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';
import { formatDuration, formatMoney } from '@/shared/utils/format';

const CATEGORY_NAMES: Readonly<Record<SpotCategory, string>> = {
  landmark: 'Landmark',
  museum: 'Museum',
  church: 'Church',
  palace: 'Palace',
  castle: 'Castle',
  monument: 'Monument',
  viewpoint: 'Viewpoint',
  park: 'Park',
  garden: 'Garden',
  neighbourhood: 'Neighbourhood',
  square: 'Square',
  market: 'Market',
  beach: 'Beach',
  aquarium: 'Aquarium',
  zoo: 'Zoo',
  bridge: 'Bridge',
};

export const categoryName = (category: SpotCategory): string =>
  CATEGORY_NAMES[category];

const DAY_NAMES: Readonly<Record<string, string>> = {
  Mo: 'Mon',
  Tu: 'Tue',
  We: 'Wed',
  Th: 'Thu',
  Fr: 'Fri',
  Sa: 'Sat',
  Su: 'Sun',
  PH: 'holidays',
};

/**
 * OpenStreetMap hours made readable, one rule per line:
 * "Oct-Apr: Tu-Su 10:00-17:30; Mo off" → "Oct–Apr: Tue–Sun 10:00–17:30\nMon closed".
 */
export const formatHours = (text: string): string =>
  text
    .split(';')
    .map((rule) => rule.trim())
    .filter((rule) => rule !== '')
    .map((rule) =>
      rule
        .replace(
          /\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g,
          (day) => DAY_NAMES[day] ?? day,
        )
        .replace(/\boff\b|\bclosed\b/g, 'closed')
        .replace(/\s*-\s*/g, '–')
        .replace(/,(?=\S)/g, ', '),
    )
    .join('\n');

/** "Free", "€ 15", "Paid entry"; an unknown fee is left out, never shown as free. */
export const feeText = (fee: Fee): string | undefined => {
  if (fee.kind === 'free') return 'Free';

  if (fee.kind === 'unknown') return undefined;

  return fee.price === null ? 'Paid entry' : formatMoney(fee.price);
};

/** The spot's facts for its details sheet; facts research didn't find are left out. */
export const spotFacts = (
  spot: Pick<
    Spot,
    'visitMinutes' | 'styles' | 'fee' | 'openingHours' | 'address'
  >,
): (readonly [term: string, value: string])[] => {
  const entry = feeText(spot.fee);

  return [
    ['Visit', `About ${formatDuration(spot.visitMinutes)}`] as const,
    ...(spot.styles.length === 0
      ? []
      : [
          [
            'Good for',
            spot.styles.map((style) => STYLE_SHORT_NAMES[style]).join(', '),
          ] as const,
        ]),
    ...(entry === undefined ? [] : [['Entry', entry] as const]),
    ...(spot.openingHours === null
      ? []
      : [['Hours', formatHours(spot.openingHours.text)] as const]),
    ...(spot.address === null || spot.address.trim() === ''
      ? []
      : [['Address', spot.address] as const]),
  ];
};

/**
 * A Google Maps search for the spot by name in its city — no API key; Maps
 * opens the place itself with its photos, reviews, hours and directions.
 */
export const googleMapsUrl = (name: string, city: string | null): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    city === null ? name : `${name}, ${city}`,
  )}`;
