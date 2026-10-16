import { healthResponseSchema } from '@waypoint/contracts/common';
import { Router } from 'express';

/** `GET /health` — public, touches nothing else. */
export const createHealthRouter = ({
  now,
}: {
  readonly now: () => Date;
}): Router =>
  Router().get('/health', (_req, res) => {
    res.json(
      healthResponseSchema.parse({ status: 'ok', time: now().toISOString() }),
    );
  });
