import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseEnv } from './env.ts'

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().min(1),
  HOTEL_PROVIDERS: z.enum(['fake', 'liteapi']).default('fake'),
})

describe('parseEnv', () => {
  it('coerces and defaults the values a service needs', () => {
    expect(parseEnv(schema, { PORT: '4001', DATABASE_URL: 'postgres://local' })).toEqual({
      PORT: 4001,
      DATABASE_URL: 'postgres://local',
      HOTEL_PROVIDERS: 'fake',
    })
  })

  it('throws, naming every missing or invalid variable, so startup fails loudly', () => {
    expect(() => parseEnv(schema, { PORT: 'nope' })).toThrow(/Invalid environment/)
    expect(() => parseEnv(schema, { PORT: 'nope' })).toThrow(/PORT/)
    expect(() => parseEnv(schema, { PORT: 'nope' })).toThrow(/DATABASE_URL/)
  })

  it('rejects an unknown provider name at startup, not at request time', () => {
    expect(() =>
      parseEnv(schema, {
        PORT: '4001',
        DATABASE_URL: 'postgres://local',
        HOTEL_PROVIDERS: 'booking',
      }),
    ).toThrow(/HOTEL_PROVIDERS/)
  })
})
