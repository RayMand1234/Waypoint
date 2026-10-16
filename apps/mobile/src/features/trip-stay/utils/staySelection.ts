import type { OfferSource } from '@waypoint/contracts/common';
import { hotelOfferSchema, type HotelOffer } from '@waypoint/contracts/hotels';
import type {
  PutSelectionRequest,
  TripDetail,
  TripSelection,
} from '@waypoint/contracts/trips';

/** The lowest-priced source — where "View on site" and booking go. */
export const lowestSource = (offer: HotelOffer): OfferSource | undefined =>
  offer.sources.reduce<OfferSource | undefined>(
    (lowest, source) =>
      lowest === undefined ||
      source.price.amountMinor < lowest.price.amountMinor
        ? source
        : lowest,
    undefined,
  );

/**
 * The chosen stay, snapshotted as shown, for `PUT /trips/:id/selections/stay`;
 * `undefined` for an offer with no source to book on.
 */
export const staySelection = (
  offer: HotelOffer,
): PutSelectionRequest | undefined => {
  const source = lowestSource(offer);

  return source === undefined
    ? undefined
    : {
        offerSnapshot: offer,
        provider: source.provider,
        deepLink: source.deepLink,
        price: offer.bestPrice,
        checkedAt: source.checkedAt,
      };
};

/** The hotel of the stay already chosen for this trip, if any. */
export const chosenHotelId = (
  trip: Pick<TripDetail, 'selections'>,
): string | undefined => {
  const snapshot = trip.selections.find(
    (selection) => selection.kind === 'stay',
  )?.offerSnapshot;
  const parsed = hotelOfferSchema.safeParse(snapshot);

  return parsed.success ? parsed.data.hotel.id : undefined;
};

/** The trip with `selection` in place of any earlier one of its kind. */
export const withSelection = (
  trip: TripDetail,
  selection: TripSelection,
): TripDetail => ({
  ...trip,
  selections: [
    ...trip.selections.filter((other) => other.kind !== selection.kind),
    selection,
  ],
});
