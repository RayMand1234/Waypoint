import type { TripPace, TripStyle } from '@waypoint/contracts/trips';
import { plural } from '@/shared/utils/text';

/** The eight trip styles, in the design's order, with their one-line hint. */
export const STYLE_OPTIONS: readonly {
  readonly id: TripStyle;
  readonly label: string;
  readonly hint: string;
}[] = [
  { id: 'chill', label: 'Chill & slow', hint: 'Cafés, parks, no rush' },
  { id: 'trails', label: 'Trails & hikes', hint: 'Marked tracks, nature' },
  { id: 'views', label: 'Beautiful views', hint: 'Viewpoints, sunsets' },
  { id: 'culture', label: 'Culture & history', hint: 'Museums, old towns' },
  { id: 'food', label: 'Food & markets', hint: 'Local dishes, markets' },
  { id: 'beach', label: 'Beaches', hint: 'Sea, sun, swimming' },
  { id: 'night', label: 'Nightlife', hint: 'Bars, live music' },
  { id: 'family', label: 'Family-friendly', hint: 'Easy days, kids welcome' },
];

export const PACE_OPTIONS: readonly {
  readonly value: TripPace;
  readonly label: string;
}[] = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'packed', label: 'Packed' },
];

/** "1 style selected", "3 styles selected". */
export const stylesCountLabel = (count: number): string =>
  `${plural(count, 'style')} selected`;

/** Adds the style, or removes it if already picked. Order follows the design, not the tapping. */
export const toggleStyle = (
  picked: readonly TripStyle[],
  style: TripStyle,
): TripStyle[] =>
  STYLE_OPTIONS.map((option) => option.id).filter((id) =>
    id === style ? !picked.includes(id) : picked.includes(id),
  );
