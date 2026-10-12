import type { Response } from 'express'
import { describe, expect, it } from 'vitest'
import { requireUserId } from './locals.ts'

const responseWith = (locals: Express.Locals): Response => ({ locals }) as Response

describe('requireUserId', () => {
  it('returns the verified user id', () => {
    expect(requireUserId(responseWith({ userId: 'user-1' }))).toBe('user-1')
  })

  it('throws when the route is not behind requireUser — a wiring mistake, not a 401', () => {
    expect(() => requireUserId(responseWith({}))).toThrow(/not behind requireUser/)
  })
})
