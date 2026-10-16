import { z } from 'zod';
import {
  adultsSchema,
  currencySchema,
  iataCodeSchema,
  isoDateSchema,
  providerErrorSchema,
} from '../common/index.ts';
import { cabinClassSchema, flightOfferSchema } from './flight.ts';

/* ── POST /flights/search ──────────────────────────────────────────────── */

/**
 * `returnDate: null` is one way. Defaults are the sample trip's party
 * (2 adults, economy).
 */
export const flightSearchRequestSchema = z
  .strictObject({
    origin: iataCodeSchema,
    destination: iataCodeSchema,
    departDate: isoDateSchema,
    returnDate: isoDateSchema.nullable().default(null),
    adults: adultsSchema.default(2),
    children: z.number().int().min(0).max(9).default(0),
    infants: z.number().int().min(0).max(9).default(0),
    cabinClass: cabinClassSchema.default('economy'),
    currency: currencySchema.default('EUR'),
    maxStops: z.number().int().min(0).max(3).nullable().default(null),
    limit: z.number().int().min(1).max(100).default(20),
  })
  .refine((request) => request.origin !== request.destination, {
    message: 'origin and destination must differ',
    path: ['destination'],
  })
  .refine(
    (request) =>
      request.returnDate === null || request.returnDate >= request.departDate,
    {
      message: 'returnDate must not be before departDate',
      path: ['returnDate'],
    },
  );
export type FlightSearchRequest = z.infer<typeof flightSearchRequestSchema>;

/** Ranked best value first. `errors` lists sources that failed this time. */
export const flightSearchResponseSchema = z.object({
  offers: z.array(flightOfferSchema),
  errors: z.array(providerErrorSchema),
});
export type FlightSearchResponse = z.infer<typeof flightSearchResponseSchema>;
