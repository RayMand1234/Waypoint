import express, { type Express } from 'express'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { REQUEST_ID_HEADER, requestId } from './requestId.ts'

let app: Express

beforeAll(() => {
  app = express()
  app.use(requestId())
  app.get('/ping', (_req, res) => {
    res.json({ requestId: res.locals.requestId })
  })
})

describe('requestId', () => {
  it('reuses the id the caller sent and echoes it back', async () => {
    const response = await request(app).get('/ping').set(REQUEST_ID_HEADER, 'trace-123')

    expect(response.body).toEqual({ requestId: 'trace-123' })
    expect(response.headers[REQUEST_ID_HEADER]).toBe('trace-123')
  })

  it('creates one when the caller sent none', async () => {
    const response = await request(app).get('/ping')

    expect(response.headers[REQUEST_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/)
    expect(response.body).toEqual({ requestId: response.headers[REQUEST_ID_HEADER] })
  })

  it('creates one when the caller sent a blank header', async () => {
    const response = await request(app).get('/ping').set(REQUEST_ID_HEADER, '   ')

    expect(response.headers[REQUEST_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/)
  })
})
