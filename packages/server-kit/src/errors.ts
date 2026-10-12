import { httpErrorBody } from '@waypoint/contracts'
import type { ErrorRequestHandler, RequestHandler } from 'express'

/** Catch-all for a path no router matched. */
export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(httpErrorBody('not-found', 'No route matches this request.'))
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
 */
export const errorHandler = ({
  report,
}: { readonly report?: ErrorReporter } = {}): ErrorRequestHandler => {
  const reportError: ErrorReporter =
    report ??
    ((error, context) => {
      console.error(`[${context.requestId ?? 'no-request-id'}]`, error)
    })

  return (error, _req, res, next) => {
    reportError(error, { requestId: res.locals.requestId })
    if (res.headersSent) {
      next(error)
      return
    }
    res.status(500).json(httpErrorBody('internal-error', 'Something went wrong on our side.'))
  }
}
