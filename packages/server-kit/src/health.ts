import { healthResponseSchema, type ServiceName } from '@waypoint/contracts/common'
import { Router } from 'express'

/** `GET /health` — every service has one, and it touches nothing else. */
export const healthRoute = ({
  service,
  now,
}: {
  readonly service: ServiceName
  readonly now: () => Date
}): Router => {
  const router = Router()
  router.get('/health', (_req, res) => {
    res.json(healthResponseSchema.parse({ status: 'ok', service, time: now().toISOString() }))
  })
  return router
}
