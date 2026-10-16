import type { HotelDetail, HotelOffer } from '@waypoint/contracts/hotels';
import type { BadgeProps, OfferDelta } from '@/shared/components';
import { offerDelta } from '@/shared/utils/offerDelta';
import { formatMoney } from '@/shared/utils/format';
import { plural } from '@/shared/utils/text';
import { qualityOf } from './stayOrder';

export type StayCardModel = {
  readonly title: string;
  readonly meta: string;
  /** How near it is: to the trip's spots, else to the city centre. */
  readonly note: string | null;
  readonly price: string;
  readonly unit: string;
  readonly delta: OfferDelta | undefined;
  readonly badges: readonly BadgeProps[];
  readonly isBestValue: boolean;
};

/** Which stays stand out among all found — worked out once per result, not per card. */
export type StayHighlights = {
  readonly bestValue: HotelOffer | undefined;
  readonly cheapestId: string | undefined;
  readonly topRatedId: string | undefined;
};

const METERS_PER_KM = 1000;
const KM_DECIMALS = 1;
const RATING_DECIMALS = 1;

export const CANCELLATION_TEXT: Readonly<
  Record<HotelOffer['cancellation'], string>
> = {
  refundable: 'Free cancellation',
  'non-refundable': 'Non-refundable',
  unknown: 'See the booking site',
};

/** The id of the first offer with the lowest `by`. */
const firstLowest = (
  offers: readonly HotelOffer[],
  by: (offer: HotelOffer) => number,
): string | undefined =>
  offers.reduce<HotelOffer | undefined>(
    (lowest, offer) =>
      lowest === undefined || by(offer) < by(lowest) ? offer : lowest,
    undefined,
  )?.hotel.id;

export const stayHighlights = (
  offers: readonly HotelOffer[],
): StayHighlights => ({
  bestValue: offers.find((offer) => offer.value.isBestValue),
  cheapestId: firstLowest(offers, (offer) => offer.bestPrice.amountMinor),
  topRatedId: firstLowest(offers, (offer) => -qualityOf(offer)),
});

const ratingText = ({ rating, stars }: HotelOffer['hotel']): string | null => {
  if (rating !== null) return `${rating.toFixed(RATING_DECIMALS)} rating`;

  return stars === null ? null : `${String(stars)}-star`;
};

const metaOf = (offer: HotelOffer): string =>
  [
    ratingText(offer.hotel),
    offer.roomName,
    offer.boardName,
    offer.cancellation === 'refundable' ? CANCELLATION_TEXT.refundable : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');

const noteOf = (offer: HotelOffer): string | null => {
  if (offer.stopsMinutes !== null)
    return `≈ ${String(offer.stopsMinutes)} min to your spots`;

  return offer.distanceMeters === null
    ? null
    : `${(offer.distanceMeters / METERS_PER_KM).toFixed(KM_DECIMALS)} km from the centre`;
};

const badgesOf = (
  offer: HotelOffer,
  highlights: StayHighlights,
): BadgeProps[] => [
  ...(offer.value.isBestValue
    ? [{ kind: 'value' as const, label: 'Best value' }]
    : []),
  ...(offer.isBestLocation
    ? [{ kind: 'neutral' as const, label: 'Best location' }]
    : []),
  ...(highlights.cheapestId === offer.hotel.id
    ? [{ kind: 'savings' as const, label: 'Cheapest' }]
    : []),
  ...(highlights.topRatedId === offer.hotel.id
    ? [{ kind: 'neutral' as const, label: 'Top rated' }]
    : []),
];

/** What one stay's card says, given what stands out among all found. */
export const stayCard = (
  offer: HotelOffer,
  highlights: StayHighlights,
): StayCardModel => ({
  title: offer.hotel.name,
  meta: metaOf(offer),
  note: noteOf(offer),
  price: formatMoney(offer.bestPrice),
  unit: `${plural(offer.nights, 'night')} · ${formatMoney(offer.pricePerNight)} / night`,
  delta: offerDelta(offer, highlights.bestValue),
  badges: badgesOf(offer, highlights),
  isBestValue: offer.value.isBestValue,
});

/** Guest scores in words, as booking sites put them: the first band reached. */
const RATING_WORDS: readonly (readonly [number, string])[] = [
  [9, 'Superb'],
  [8.5, 'Excellent'],
  [8, 'Very good'],
  [7, 'Good'],
];

export const ratingWords = (rating: number): string =>
  RATING_WORDS.find(([from]) => rating >= from)?.[1] ?? 'Guest score';

/** The details sheet's photos: the hotel's gallery once loaded, else its main photo. */
export const stayPhotos = (
  offer: HotelOffer,
  detail: HotelDetail | undefined,
): readonly string[] =>
  detail !== undefined && detail.imageUrls.length > 0
    ? detail.imageUrls
    : [offer.hotel.mainPhotoUrl].filter((url) => url !== null);
