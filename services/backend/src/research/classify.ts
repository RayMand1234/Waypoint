import type { SpotCategory } from '@waypoint/contracts/destinations';
import type { TripStyle } from '@waypoint/contracts/trips';

// Wikidata classes a spot can belong to, most specific first: a place that is
// both a museum and a palace reads as a museum. Each id is a Wikidata class.
export const CATEGORY_CLASSES: readonly (readonly [string, SpotCategory])[] = [
  ['Q2281788', 'aquarium'],
  ['Q43501', 'zoo'],
  ['Q33506', 'museum'],
  ['Q23413', 'castle'],
  ['Q16560', 'palace'],
  ['Q6017969', 'viewpoint'],
  ['Q37654', 'market'],
  ['Q40080', 'beach'],
  ['Q167346', 'garden'],
  ['Q1107656', 'garden'],
  ['Q22698', 'park'],
  ['Q44613', 'church'],
  ['Q16970', 'church'],
  ['Q174782', 'square'],
  ['Q123705', 'neighbourhood'],
  ['Q12280', 'bridge'],
  ['Q4989906', 'monument'],
  ['Q12518', 'landmark'],
  ['Q839954', 'landmark'],
  ['Q570116', 'landmark'],
];

/**
 * Places of these classes are never spots, whatever else they are: a city
 * (Paris itself, an ancient city like Lutetia) is a destination, not a stop;
 * a stock exchange counts as a market; a proposed building isn't built.
 */
export const EXCLUDED_CLASSES: readonly string[] = [
  'Q515', // city
  'Q15661340', // ancient city
  'Q11691', // stock exchange
  'Q811683', // proposed building or structure
];

/** Every class research asks Wikidata about. */
export const RESEARCH_CLASSES: readonly string[] = [
  ...CATEGORY_CLASSES.map(([id]) => id),
  ...EXCLUDED_CLASSES,
];

/** What a category suits, and how long a typical visit takes. A reviewer can adjust either per spot. */
export const CATEGORY_DEFAULTS: Readonly<
  Record<
    SpotCategory,
    { readonly styles: readonly TripStyle[]; readonly visitMinutes: number }
  >
> = {
  landmark: { styles: ['culture', 'views'], visitMinutes: 45 },
  museum: { styles: ['culture'], visitMinutes: 120 },
  church: { styles: ['culture'], visitMinutes: 45 },
  palace: { styles: ['culture'], visitMinutes: 90 },
  castle: { styles: ['culture', 'views'], visitMinutes: 90 },
  monument: { styles: ['culture'], visitMinutes: 30 },
  viewpoint: { styles: ['views', 'chill'], visitMinutes: 30 },
  park: { styles: ['chill', 'family'], visitMinutes: 60 },
  garden: { styles: ['chill'], visitMinutes: 60 },
  neighbourhood: { styles: ['culture', 'food', 'night'], visitMinutes: 120 },
  square: { styles: ['culture', 'chill'], visitMinutes: 20 },
  market: { styles: ['food'], visitMinutes: 60 },
  beach: { styles: ['beach', 'chill'], visitMinutes: 180 },
  aquarium: { styles: ['family'], visitMinutes: 150 },
  zoo: { styles: ['family'], visitMinutes: 180 },
  bridge: { styles: ['views'], visitMinutes: 20 },
};

/**
 * The most specific category among a place's classes; `undefined` if none is
 * one we visit, or the place is of an excluded class.
 */
export const categoryOf = (
  classIds: readonly string[],
): SpotCategory | undefined =>
  EXCLUDED_CLASSES.some((id) => classIds.includes(id))
    ? undefined
    : CATEGORY_CLASSES.find(([id]) => classIds.includes(id))?.[1];
