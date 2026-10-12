import { z } from 'zod'

/** Currencies Waypoint can show a price in. Additive: new codes may be appended. */
export const currencySchema = z.enum(['EUR', 'USD', 'GBP', 'ILS', 'RUB'])
export type Currency = z.infer<typeof currencySchema>

/**
 * Money is always integer minor units (cents, agorot) plus a currency code.
 * Never a float: 12.30 EUR is `{ amountMinor: 1230, currency: 'EUR' }`.
 */
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: currencySchema,
})
export type Money = z.infer<typeof moneySchema>
