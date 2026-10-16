import type { HotelOffer } from '@waypoint/contracts/hotels';

/** What matters most when ordering stays. */
export type StayMode = 'cheapest' | 'value' | 'quality';

export const STAY_MODES: readonly {
  readonly value: StayMode;
  readonly label: string;
}[] = [
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'value', label: 'Best value' },
  { value: 'quality', label: 'Top quality' },
];

/** Stars are out of 5, guest ratings out of 10. */
const STARS_TO_RATING = 2;
/** Neither rating nor stars: below any real score. */
const UNKNOWN_QUALITY = -1;

/** A stay's quality on the 10-point guest-rating scale: its rating, else its stars. */
export const qualityOf = (offer: HotelOffer): number => {
  const { rating, stars } = offer.hotel;

  if (rating !== null) return rating;

  return stars === null ? UNKNOWN_QUALITY : stars * STARS_TO_RATING;
};

const COMPARE: Readonly<
  Record<StayMode, ((a: HotelOffer, b: HotelOffer) => number) | undefined>
> = {
  cheapest: (a, b) => a.bestPrice.amountMinor - b.bestPrice.amountMinor,
  // The server's order: value for money, location included.
  value: undefined,
  quality: (a, b) => qualityOf(b) - qualityOf(a),
};

/** The stays in the mode's order; ties keep the server's (best value) order. */
export const orderStays = (
  offers: readonly HotelOffer[],
  mode: StayMode,
): HotelOffer[] => {
  const compare = COMPARE[mode];

  return compare === undefined ? [...offers] : [...offers].sort(compare);
};
