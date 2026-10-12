import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Gives every request an id so one traveler action can be traced across
 * services: the app creates it, each service reuses the incoming one and echoes
 * it back, and the service client forwards it on.
 */
export const requestId = (): RequestHandler => (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER)
  const id = incoming !== undefined && incoming.trim() !== '' ? incoming.trim() : randomUUID()
  res.locals.requestId = id
  res.setHeader(REQUEST_ID_HEADER, id)
  next()
}
