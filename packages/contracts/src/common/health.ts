import { z } from 'zod';
import { isoDateTimeSchema } from './dates.ts';

/** What `GET /health` answers with. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  time: isoDateTimeSchema,
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
