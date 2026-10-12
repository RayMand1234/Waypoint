import { httpErrorBody } from '@waypoint/contracts/common'
import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { UNAUTHORIZED } from '../errorCodes.ts'

export const INTERNAL_API_KEY_HEADER = 'x-internal-api-key'

const matches = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Guards internal-only routes. `jobs` acts for nobody, so it has no user token;
 * it calls with the shared internal key instead. Internal routes accept only
 * this — never a user token.
 */
export const requireService = ({
  internalApiKey,
}: {
  readonly internalApiKey: string
}): RequestHandler => {
  if (internalApiKey === '') {
    throw new Error('requireService needs a non-empty internal API key')
  }

  return (req, res, next) => {
    const presented = req.get(INTERNAL_API_KEY_HEADER)
    if (presented === undefined || !matches(presented, internalApiKey)) {
      res.status(401).json(httpErrorBody(UNAUTHORIZED, 'This route is internal.'))
      return
    }
    next()
  }
}
