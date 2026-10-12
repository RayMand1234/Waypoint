import { z } from 'zod'
import { isoDateTimeSchema } from './dates.ts'

/** What every service's `GET /health` answers with. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  time: isoDateTimeSchema,
})
export type HealthResponse = z.infer<typeof healthResponseSchema>
