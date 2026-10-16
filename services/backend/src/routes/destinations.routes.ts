import { Router } from 'express';
import type { DestinationsController } from '../controllers/destinations.controller.ts';

export const createDestinationsRouter = (
  destinations: DestinationsController,
): Router =>
  Router()
    .get('/destinations', destinations.list)
    .post('/destinations', destinations.add)
    .get('/destinations/:destinationId', destinations.get)
    .get('/destinations/:destinationId/spots', destinations.spots)
    .get('/spots/:spotId', destinations.spot)
    .get('/spots/:spotId/rating', destinations.rating);
