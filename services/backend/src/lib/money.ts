import { currencySchema, type Money } from '@waypoint/contracts/common';

/**
 * A provider's decimal amount (`123.45`) as Waypoint money (`12345` minor
 * units). `undefined` for a currency Waypoint can't show, so the caller
 * drops that price rather than mislabel it. Every supported currency has
 * two decimals.
 */
export const toMoney = (
  amount: number,
  currency: string,
): Money | undefined => {
  const parsed = currencySchema.safeParse(currency.toUpperCase());

  return parsed.success && Number.isFinite(amount)
    ? { amountMinor: Math.round(amount * 100), currency: parsed.data }
    : undefined;
};
