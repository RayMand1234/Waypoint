import { Router } from 'express';
import type { TripsController } from '../controllers/trips.controller.ts';

export const createTripsRouter = (trips: TripsController): Router =>
  Router()
    .get('/trips', trips.list)
    .post('/trips', trips.create)
    .get('/trips/:id', trips.get)
    .patch('/trips/:id', trips.update)
    .delete('/trips/:id', trips.remove)
    .put('/trips/:id/plan', trips.putPlan)
    .put('/trips/:id/selections/:kind', trips.putSelection)
    .patch('/trips/:id/selections/:kind/booked', trips.setBooked);
