import type { Money, OfferValue } from '@waypoint/contracts/common';
import type { OfferDelta } from '../components/OfferCard';
import { formatMoney } from './format';

/** What a price comparison needs from any offer. */
type Compared = {
  readonly bestPrice: Money;
  readonly value: OfferValue;
};

const money = (offer: Compared, amountMinor: number): string =>
  formatMoney({ amountMinor, currency: offer.bestPrice.currency });

/**
 * The line under a price: the best-value offer against the average; every
 * other one against the best value. `undefined` when there's nothing to say.
 */
export const offerDelta = (
  offer: Compared,
  best: Compared | undefined,
): OfferDelta | undefined => {
  if (offer.value.isBestValue) {
    const savings = offer.value.savingsVsAverage.amountMinor;

    return savings > 0
      ? { text: `−${money(offer, savings)} vs avg`, direction: 'down' }
      : undefined;
  }

  const diff =
    best === undefined
      ? 0
      : offer.bestPrice.amountMinor - best.bestPrice.amountMinor;

  if (diff === 0) return undefined;

  return diff < 0
    ? { text: `−${money(offer, -diff)} vs best value`, direction: 'down' }
    : { text: `+${money(offer, diff)} vs best value`, direction: 'up' };
};
