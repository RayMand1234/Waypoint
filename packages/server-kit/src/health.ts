import { healthResponseSchema } from '@waypoint/contracts'
import { Router } from 'express'

/** `GET /health` — every service has one, and it touches nothing else. */
export const healthRoute = ({
  service,
  now,
}: {
  readonly service: string
  readonly now: () => Date
}): Router => {
  const router = Router()
  router.get('/health', (_req, res) => {
    res.json(healthResponseSchema.parse({ status: 'ok', service, time: now().toISOString() }))
  })
  return router
}
