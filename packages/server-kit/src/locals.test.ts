import { describe, expect, it } from 'vitest'
import { requireUserId, toUserId } from './locals.ts'

describe('requireUserId', () => {
  it('returns the verified user id', () => {
    expect(requireUserId({ locals: { userId: toUserId('user-1') } })).toBe('user-1')
  })

  it('throws when the route is not behind requireUser — a wiring mistake, not a 401', () => {
    expect(() => requireUserId({ locals: {} })).toThrow(/not behind requireUser/)
  })
})
