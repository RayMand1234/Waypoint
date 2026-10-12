import { httpErrorBodySchema } from '@waypoint/contracts/common'
import express, { type Express } from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { parseBody, parseParams } from './validation.ts'

const bodySchema = z.strictObject({ name: z.string().min(1) })
const paramsSchema = z.object({ id: z.uuid() })

const buildApp = (): Express => {
  const app = express()
  app.use(express.json())
  app.post('/greet', (req, res) => {
    const body = parseBody(bodySchema, req, res)
    if (body === undefined) return
    res.json({ greeting: `hi ${body.name}` })
  })
  app.get('/items/:id', (req, res) => {
    const params = parseParams(paramsSchema, req, res)
    if (params === undefined) return
    res.json({ id: params.id })
  })
  return app
}

describe('parseBody', () => {
  it('returns the parsed body on success', async () => {
    const response = await request(buildApp()).post('/greet').send({ name: 'Ada' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ greeting: 'hi Ada' })
  })

  it('answers 400 with the shared error body on failure, instead of calling the handler', async () => {
    const response = await request(buildApp()).post('/greet').send({})

    expect(response.status).toBe(400)
    expect(httpErrorBodySchema.parse(response.body).error.code).toBe('invalid-request')
  })

  it('rejects an unknown field, since request bodies are strict', async () => {
    const response = await request(buildApp()).post('/greet').send({ name: 'Ada', extra: true })

    expect(response.status).toBe(400)
  })
})

describe('parseParams', () => {
  const id = '00000000-0000-4000-8000-000000000000'

  it('returns the parsed params on success', async () => {
    const response = await request(buildApp()).get(`/items/${id}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id })
  })

  it('answers 400 when a param fails validation', async () => {
    const response = await request(buildApp()).get('/items/not-a-uuid')

    expect(response.status).toBe(400)
    expect(httpErrorBodySchema.parse(response.body).error.code).toBe('invalid-request')
  })
})
