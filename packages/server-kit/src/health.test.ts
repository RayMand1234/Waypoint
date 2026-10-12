import { healthResponseSchema } from '@waypoint/contracts'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { healthRoute } from './health.ts'

describe('healthRoute', () => {
  it('answers with the shared health shape and the injected clock', async () => {
    const now = new Date('2026-05-12T09:30:00.000Z')
    const app = express().use(healthRoute({ service: 'trips', now: () => now }))

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(healthResponseSchema.parse(response.body)).toEqual({
      status: 'ok',
      service: 'trips',
      time: '2026-05-12T09:30:00.000Z',
    })
  })
})
