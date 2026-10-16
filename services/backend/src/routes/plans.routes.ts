import { Router } from 'express';
import type { PlansController } from '../controllers/plans.controller.ts';

export const createPlansRouter = (plans: PlansController): Router =>
  Router().post('/trips/:id/plan', plans.build);
