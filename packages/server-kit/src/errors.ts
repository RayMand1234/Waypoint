import { httpErrorBody } from '@waypoint/contracts/common'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { INTERNAL_ERROR, NOT_FOUND } from './errorCodes.ts'

/** Catch-all for a path no router matched. */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(httpErrorBody(NOT_FOUND, 'No route matches this request.'))
}

export type ErrorReporter = (
  error: unknown,
  context: { readonly requestId: string | undefined },
) => void

/**
 * Last middleware in every service. Expected failures never reach here — they
 * come back as a `Result` and the route maps them to a status. Anything that
 * does reach here is a programmer error, so it is reported and answered with a
 * 500 that leaks nothing.
 *
 * `report` is required, not defaulted to `console.error` — this package's own
 * rule is "dependencies are arguments"; a service's composition root decides
 * where errors go (console in development, Sentry once Phase 2 adds it).
 */
export const errorHandler = ({
  report,
}: {
  readonly report: ErrorReporter
}): ErrorRequestHandler => {
  return (error, _req, res, next) => {
    report(error, { requestId: res.locals.requestId })
    if (res.headersSent) {
      next(error)
      return
    }
    res.status(500).json(httpErrorBody(INTERNAL_ERROR, 'Something went wrong on our side.'))
  }
}
