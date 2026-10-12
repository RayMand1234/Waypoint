import { describe, expect, it } from 'vitest'
import { bearerToken } from './bearerToken.ts'

const JWT = 'eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1LTEifQ.c2lnbmF0dXJl-_x'

describe('bearerToken', () => {
  it('pulls the compact JWT out of the header', () => {
    expect(bearerToken(`Bearer ${JWT}`)).toBe(JWT)
  })

  it('tolerates extra whitespace around the token', () => {
    expect(bearerToken(`Bearer  ${JWT} `)).toBe(JWT)
  })

  it.each([
    ['no header', undefined],
    ['no scheme', JWT],
    ['the wrong scheme', `Basic ${JWT}`],
    ['the wrong case', `bearer ${JWT}`],
    ['no token', 'Bearer '],
    ['something that is not a compact JWT', 'Bearer not-a-jwt'],
  ])('returns undefined for %s', (_label, header) => {
    expect(bearerToken(header)).toBeUndefined()
  })
})
