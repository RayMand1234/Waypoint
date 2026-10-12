import { z } from 'zod'
import { isoDateTimeSchema } from './dates.ts'
import { serviceNameSchema } from './serviceName.ts'

/** What every service's `GET /health` answers with. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: serviceNameSchema,
  time: isoDateTimeSchema,
})
export type HealthResponse = z.infer<typeof healthResponseSchema>
