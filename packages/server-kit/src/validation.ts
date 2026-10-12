import { httpErrorBody } from '@waypoint/contracts/common'
import type { Request, Response } from 'express'
import type { z } from 'zod'
import { INVALID_REQUEST } from './errorCodes.ts'

const respondInvalid = (res: Response, error: z.ZodError): void => {
  res
    .status(400)
    .json(httpErrorBody(INVALID_REQUEST, error.issues[0]?.message ?? 'Invalid request.'))
}

/**
 * Parses `req.body` against a contract schema. On success returns the parsed
 * value; on failure it writes the 400 response itself and returns `undefined`
 * — the route just checks for `undefined` and returns, so every route's
 * "parse input with the contract schema" step looks the same.
 */
export const parseBody = <Schema extends z.ZodType>(
  schema: Schema,
  req: Request,
  res: Response,
): z.output<Schema> | undefined => {
  const parsed = schema.safeParse(req.body)
  if (parsed.success) return parsed.data
  respondInvalid(res, parsed.error)
  return undefined
}

/** Same as `parseBody`, for `req.params` — e.g. validating a path's `:id` as a UUID. */
export const parseParams = <Schema extends z.ZodType>(
  schema: Schema,
  req: Request,
  res: Response,
): z.output<Schema> | undefined => {
  const parsed = schema.safeParse(req.params)
  if (parsed.success) return parsed.data
  respondInvalid(res, parsed.error)
  return undefined
}
