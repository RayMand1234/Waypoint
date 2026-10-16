import { currencySchema } from '@waypoint/contracts/common';
import type { Fee } from '@waypoint/contracts/destinations';
import { toMoney } from '../lib/money.ts';

const SYMBOLS: Readonly<Record<string, string>> = {
  '€': 'EUR',
  $: 'USD',
  '£': 'GBP',
  '₪': 'ILS',
};

/** "15 EUR", "€15", "15€", "12.50 EUR" → money; anything else (ranges, words) → `null`. */
const parseCharge = (charge: string) => {
  const text = charge.trim();
  const match =
    /^(\d+(?:[.,]\d{1,2})?)\s*([A-Z]{3}|[€$£₪])$/.exec(text) ??
    /^([€$£₪])\s*(\d+(?:[.,]\d{1,2})?)$/.exec(text);

  if (match === null) return null;

  const [amountText, unit] = /^\d/.test(match[1] ?? '')
    ? [match[1], match[2]]
    : [match[2], match[1]];
  const currency = currencySchema.safeParse(SYMBOLS[unit ?? ''] ?? unit);

  return currency.success && amountText !== undefined
    ? (toMoney(Number(amountText.replace(',', '.')), currency.data) ?? null)
    : null;
};

/**
 * Entry fee from OpenStreetMap's `fee` / `charge` tags. A missing `fee` is
 * `unknown`, never free; a charge we can't read is "paid, price unknown".
 */
export const parseFee = (
  fee: string | undefined,
  charge: string | undefined,
): Fee => {
  if (fee === 'no') return { kind: 'free' };

  if (fee === 'yes' || charge !== undefined) {
    return {
      kind: 'paid',
      price: charge === undefined ? null : parseCharge(charge),
    };
  }

  return { kind: 'unknown' };
};
