import { describe, expect, it } from 'vitest'
import { assertNever } from './assertNever.ts'
import { isoDateSchema, isoDateTimeSchema, isoTimeSchema } from './dates.ts'
import { httpErrorBody, httpErrorBodySchema, toHttpErrorCode } from './httpError.ts'
import { moneySchema } from './money.ts'
import { err, ok } from './result.ts'

describe('Result', () => {
  it('ok carries the value and narrows on the discriminant', () => {
    const result = ok(3)
    expect(result).toEqual({ ok: true, value: 3 })
    expect(result.ok ? result.value : 'unreachable').toBe(3)
  })

  it('err carries the error and narrows on the discriminant', () => {
    const result = err({ type: 'not-found' } as const)
    expect(result.ok ? 'unreachable' : result.error.type).toBe('not-found')
  })
})

describe('assertNever', () => {
  it('throws, because reaching it means an invariant broke', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/Unhandled union member/)
  })
})

describe('money', () => {
  it('accepts integer minor units', () => {
    expect(moneySchema.parse({ amountMinor: 1230, currency: 'EUR' })).toEqual({
      amountMinor: 1230,
      currency: 'EUR',
    })
  })

  it('rejects a float amount, so no price is ever stored as 12.3', () => {
    expect(moneySchema.safeParse({ amountMinor: 12.3, currency: 'EUR' }).success).toBe(false)
  })

  it('rejects an unknown currency', () => {
    expect(moneySchema.safeParse({ amountMinor: 1, currency: 'XYZ' }).success).toBe(false)
  })
})

describe('dates', () => {
  it('isoDate takes a calendar date and refuses a timestamp', () => {
    expect(isoDateSchema.parse('2026-05-12')).toBe('2026-05-12')
    expect(isoDateSchema.safeParse('2026-05-12T09:30:00Z').success).toBe(false)
    expect(isoDateSchema.safeParse('2026-13-01').success).toBe(false)
  })

  it('isoDateTime requires an offset', () => {
    expect(isoDateTimeSchema.parse('2026-05-12T09:30:00.000Z')).toBe('2026-05-12T09:30:00.000Z')
    expect(isoDateTimeSchema.safeParse('2026-05-12 09:30').success).toBe(false)
  })

  it('isoTime takes a wall-clock time of day', () => {
    expect(isoTimeSchema.parse('09:30')).toBe('09:30')
    expect(isoTimeSchema.safeParse('25:00').success).toBe(false)
  })
})

describe('httpErrorBody', () => {
  it('builds the one error shape every service returns', () => {
    const body = httpErrorBody(toHttpErrorCode('not-found'), 'That trip does not exist.')
    expect(httpErrorBodySchema.parse(body)).toEqual(body)
  })

  it('rejects a code that is not kebab-case', () => {
    expect(
      httpErrorBodySchema.safeParse({ error: { code: 'NotFound', message: 'x' } }).success,
    ).toBe(false)
  })

  it('toHttpErrorCode throws on a code that is not kebab-case, rather than shipping it', () => {
    expect(() => toHttpErrorCode('NotFound')).toThrow()
  })
})
