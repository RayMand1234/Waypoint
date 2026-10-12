import { z } from 'zod'

/**
 * One id per provider adapter folder. `fake` and `fake-alt` are the offline
 * providers that return the sample Tel Aviv → Lisbon trip, so the app and the
 * tests run with no API keys; `fake-alt` exists so a merged offer can have more
 * than one source and "Where we found it" has rows to show.
 */
export const providerIdSchema = z.enum(['fake', 'fake-alt', 'liteapi', 'aviasales'])
export type ProviderId = z.infer<typeof providerIdSchema>
