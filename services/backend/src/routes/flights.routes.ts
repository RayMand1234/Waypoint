import { Router } from 'express';
import type { FlightsController } from '../controllers/flights.controller.ts';

export const createFlightsRouter = (flights: FlightsController): Router =>
  Router().post('/flights/search', flights.search);
