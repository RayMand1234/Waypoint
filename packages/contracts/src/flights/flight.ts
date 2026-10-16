import { z } from 'zod';
import {
  isoDateTimeSchema,
  isoLocalDateTimeSchema,
  moneySchema,
  offerSourceSchema,
  offerValueSchema,
} from '../common/index.ts';

export const cabinClassSchema = z.enum([
  'economy',
  'premium-economy',
  'business',
  'first',
]);
export type CabinClass = z.infer<typeof cabinClassSchema>;

/** One flight. Times are local to each airport, so they carry no offset. */
export const flightSegmentSchema = z.object({
  from: z.string().min(1),
  fromName: z.string().nullable(),
  to: z.string().min(1),
  toName: z.string().nullable(),
  departAt: isoLocalDateTimeSchema,
  arriveAt: isoLocalDateTimeSchema,
  carrier: z.object({
    code: z.string().min(1),
    name: z.string().nullable(),
    logoUrl: z.string().nullable(),
  }),
  flightNumber: z.string().min(1),
  durationMinutes: z.number().int().min(0),
});
export type FlightSegment = z.infer<typeof flightSegmentSchema>;

/** The way out or the way back: one or more segments, `stops` between them. */
export const flightLegSchema = z.object({
  direction: z.enum(['outbound', 'inbound']),
  departAt: isoLocalDateTimeSchema,
  arriveAt: isoLocalDateTimeSchema,
  durationMinutes: z.number().int().min(0),
  stops: z.number().int().min(0),
  segments: z.array(flightSegmentSchema).min(1),
});
export type FlightLeg = z.infer<typeof flightLegSchema>;

/** One itinerary (outbound, plus inbound on a round trip) at its cheapest fare. */
export const flightOfferSchema = z.object({
  id: z.string().min(1),
  legs: z.array(flightLegSchema).min(1),
  bestPrice: moneySchema,
  /** `null` when the provider didn't say — shown as "check terms", never as "no". */
  refundable: z.boolean().nullable(),
  changeable: z.boolean().nullable(),
  baggage: z.object({
    carryOn: z.boolean().nullable(),
    checked: z.boolean().nullable(),
  }),
  seatsRemaining: z.number().int().min(0).nullable(),
  /** When the provider stops honouring this fare; `null` if it didn't say. */
  expiresAt: isoDateTimeSchema.nullable(),
  sources: z.array(offerSourceSchema).min(1),
  value: offerValueSchema,
});
export type FlightOffer = z.infer<typeof flightOfferSchema>;
