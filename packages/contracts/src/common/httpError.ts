import { z } from 'zod';

/** `kebab-case`, e.g. `not-found`, `provider-timeout`. */
export const httpErrorCodeSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'expected a kebab-case error code')
  .brand<'HttpErrorCode'>();
export type HttpErrorCode = z.infer<typeof httpErrorCodeSchema>;

/** The one error body every Waypoint service returns for a non-2xx response. */
export const httpErrorBodySchema = z.object({
  error: z.object({
    code: httpErrorCodeSchema,
    message: z.string().min(1),
  }),
});
export type HttpErrorBody = z.infer<typeof httpErrorBodySchema>;

/** Validates and brands a literal error code at its one call site. */
export const toHttpErrorCode = (code: string): HttpErrorCode =>
  httpErrorCodeSchema.parse(code);

/**
 * Branded, so a route can't pass a code `httpErrorCodeSchema` would reject —
 * `httpErrorBody('NotFound', '…')` is now a type error, not a value that
 * silently fails to parse on the other end of a service call.
 */
export const httpErrorBody = (
  code: HttpErrorCode,
  message: string,
): HttpErrorBody => ({
  error: { code, message },
});
