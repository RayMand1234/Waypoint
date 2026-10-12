import { z } from 'zod'

/**
 * A JSON object whose shape another service owns — used where `trips` stores a
 * value it never interprets (an offer snapshot exactly as the app showed it).
 * Deliberately loose: tightening it later would break whoever already stores one.
 */
export const jsonObjectSchema = z.record(z.string(), z.unknown())
export type JsonObject = z.infer<typeof jsonObjectSchema>
