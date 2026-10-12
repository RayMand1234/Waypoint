import { z } from 'zod'

/** `kebab-case`, e.g. `not-found`, `provider-timeout`. */
export const httpErrorCodeSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a kebab-case error code')

/** The one error body every Waypoint service returns for a non-2xx response. */
export const httpErrorBodySchema = z.object({
  error: z.object({
    code: httpErrorCodeSchema,
    message: z.string().min(1),
  }),
})
export type HttpErrorBody = z.infer<typeof httpErrorBodySchema>

export const httpErrorBody = (code: string, message: string): HttpErrorBody => ({
  error: { code, message },
})
