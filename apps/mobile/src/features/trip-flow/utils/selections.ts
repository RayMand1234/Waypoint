import type { OfferSource } from '@waypoint/contracts/common';
import type {
  PutSelectionRequest,
  SelectionKind,
  TripDetail,
  TripSelection,
} from '@waypoint/contracts/trips';
import type { z } from 'zod';

/** An offer the traveler can choose: priced, with the sites it was found on. */
type ChoosableOffer = {
  readonly bestPrice: TripSelection['price'];
  readonly sources: readonly OfferSource[];
};

/** The lowest-priced source — where "View on site" and booking go. */
export const lowestSource = (
  sources: readonly OfferSource[],
): OfferSource | undefined =>
  sources.reduce<OfferSource | undefined>(
    (lowest, source) =>
      lowest === undefined ||
      source.price.amountMinor < lowest.price.amountMinor
        ? source
        : lowest,
    undefined,
  );

/**
 * The chosen offer, snapshotted as shown, for `PUT /trips/:id/selections/:kind`;
 * `undefined` for an offer with no site to book on.
 */
export const selectionOf = (
  offer: ChoosableOffer,
): PutSelectionRequest | undefined => {
  const source = lowestSource(offer.sources);

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

/** The saved snapshot of one part of the trip, read with its offer schema; `undefined` if none (or it no longer parses). */
export const savedOffer = <Schema extends z.ZodType>(
  trip: Pick<TripDetail, 'selections'>,
  kind: SelectionKind,
  schema: Schema,
): z.output<Schema> | undefined => {
  const parsed = schema.safeParse(
    trip.selections.find((selection) => selection.kind === kind)?.offerSnapshot,
  );

  return parsed.success ? parsed.data : undefined;
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
