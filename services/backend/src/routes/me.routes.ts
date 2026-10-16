import { Router } from 'express';
import type { MeController } from '../controllers/me.controller.ts';

export const createMeRouter = (me: MeController): Router =>
  Router().get('/me', me.get).patch('/me', me.update);
