import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';
import { formatMoney } from '@/shared/utils/format';
import { fold } from '@/shared/utils/text';
import { plural } from '@/shared/utils/text';

/** A destination card, worded. */
export type DestinationCardModel = {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly meta: string;
  /** "Stays from $ 150 / night" — an estimate; `null` when unknown. */
  readonly price: string | null;
  readonly why: string;
  readonly isBestMatch: boolean;
};

const MAX_STYLES_IN_META = 3;

export const toDestinationCard = (
  destination: DestinationSuggestion,
): DestinationCardModel => {
  const known = destination.styles
    .slice(0, MAX_STYLES_IN_META)
    .map((style) => STYLE_SHORT_NAMES[style]);
  const matched = destination.matchedStyles.map((style) =>
    STYLE_SHORT_NAMES[style].toLowerCase(),
  );

  return {
    id: destination.id,
    code: destination.airport,
    title: `${destination.name}, ${destination.countryName}`,
    meta: [...known, plural(destination.spotCount, 'spot')].join(' · '),
    price:
      destination.stayPerNight === null
        ? null
        : `Stays from ${formatMoney(destination.stayPerNight)} / night`,
    why: destination.isBestMatch
      ? 'Best match for your styles'
      : matched.length === 0
        ? 'Not much of your styles'
        : `Good for ${matched.join(', ')}`,
    isBestMatch: destination.isBestMatch,
  };
};

/** Destinations whose city or country starts a word with the search (case and accents ignored). */
export const filterDestinations = (
  destinations: readonly DestinationSuggestion[],
  search: string,
): DestinationSuggestion[] => {
  const query = fold(search.trim());

  if (query === '') return [...destinations];

  return destinations.filter((destination) =>
    fold(`${destination.name} ${destination.countryName}`)
      .split(/\s+/)
      .some((word) => word.startsWith(query)),
  );
};
