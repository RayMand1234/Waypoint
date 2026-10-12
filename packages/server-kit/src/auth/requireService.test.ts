import express, { type Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { INTERNAL_API_KEY_HEADER, requireService } from './requireService.ts'

const KEY = 'internal-key-for-tests'

let app: Express

beforeAll(() => {
  app = express()
  app.get('/internal/estimates', requireService({ internalApiKey: KEY }), (_req, res) => {
    res.json({ ok: true })
  })
})

describe('requireService', () => {
  it('lets a caller through with the internal key', async () => {
    const response = await request(app).get('/internal/estimates').set(INTERNAL_API_KEY_HEADER, KEY)

    expect(response.status).toBe(200)
  })

  it.each([
    ['no key', undefined],
    ['the wrong key', 'nope'],
    ['a key with the right length but wrong bytes', 'x'.repeat(KEY.length)],
    ['a prefix of the key', KEY.slice(0, -1)],
  ])('answers 401 for %s', async (_label, presented) => {
    const pending = request(app).get('/internal/estimates')
    const response = await (presented === undefined
      ? pending
      : pending.set(INTERNAL_API_KEY_HEADER, presented))

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: { code: 'unauthorized', message: 'This route is internal.' },
    })
  })

  it('refuses to be built with an empty key, so a blank env var cannot open a route', () => {
    expect(() => requireService({ internalApiKey: '' })).toThrow(/non-empty internal API key/)
  })
})
