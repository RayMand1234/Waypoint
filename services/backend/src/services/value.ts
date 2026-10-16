import type { Currency, Money, OfferValue } from '@waypoint/contracts/common';
import { median } from '../lib/stats.ts';

/** What value scoring needs from any offer. `quality` is in (0, 1]. */
export type Priced = { readonly priceMinor: number; readonly quality: number };

/** Scores are rounded to three decimals. */
const SCORE_PRECISION = 1000;

export type Ranked<T> = { readonly item: T; readonly value: OfferValue };

/**
 * Ranks offers by value — quality for the money — never by who pays more.
 * `score = quality / (price / medianPrice)`: an offer as good as the rest at
 * half the median price scores 2. Exactly one offer (the top score, first on
 * ties) is `isBestValue`. `savingsVsAverage` is how far under the mean price
 * an offer sits (zero if above). Pure; sorted best first, stable on ties.
 */
export const rankByValue = <T>(
  items: readonly T[],
  toPriced: (item: T) => Priced,
  currency: Currency,
): Ranked<T>[] => {
  const priced = items.map((item) => ({ item, ...toPriced(item) }));
  const prices = priced.map((p) => p.priceMinor);
  const typical = median(prices);
  const mean =
    prices.reduce((sum, price) => sum + price, 0) / Math.max(prices.length, 1);
  const money = (amountMinor: number): Money => ({ amountMinor, currency });

  return priced
    .map(({ item, priceMinor, quality }) => ({
      item,
      score:
        priceMinor > 0 && typical > 0 ? quality / (priceMinor / typical) : 0,
      savings: money(Math.max(0, Math.round(mean - priceMinor))),
    }))
    .toSorted((a, b) => b.score - a.score)
    .map(({ item, score, savings }, index) => ({
      item,
      value: {
        score: Math.round(score * SCORE_PRECISION) / SCORE_PRECISION,
        isBestValue: index === 0,
        savingsVsAverage: savings,
      },
    }));
};
