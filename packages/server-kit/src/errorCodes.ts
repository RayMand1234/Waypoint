import { toHttpErrorCode } from '@waypoint/contracts/common'

/**
 * The small, cross-service vocabulary of error codes — named once, exported
 * from this package, so every service's routes answer "not found" or "invalid
 * request" with the same code instead of each spelling its own close variant
 * (`'not-found'` vs `'notFound'` vs `'trip-not-found'`). A service with a
 * genuinely domain-specific failure still defines its own code via
 * `toHttpErrorCode`; this is only the handful that recur everywhere.
 */
export const NOT_FOUND = toHttpErrorCode('not-found')
export const UNAUTHORIZED = toHttpErrorCode('unauthorized')
export const INVALID_REQUEST = toHttpErrorCode('invalid-request')
export const INTERNAL_ERROR = toHttpErrorCode('internal-error')
