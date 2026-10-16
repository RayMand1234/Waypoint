import { Router, type RequestHandler } from 'express';
import { createDestinationsController } from '../controllers/destinations.controller.ts';
import { createFlightsController } from '../controllers/flights.controller.ts';
import { createGeoController } from '../controllers/geo.controller.ts';
import { createHotelsController } from '../controllers/hotels.controller.ts';
import { createMeController } from '../controllers/me.controller.ts';
import { createPlansController } from '../controllers/plans.controller.ts';
import { createTripsController } from '../controllers/trips.controller.ts';
import type { DestinationsService } from '../services/destinations.service.ts';
import type { FlightsService } from '../services/flights.service.ts';
import type { GeoService } from '../services/geo.service.ts';
import type { HotelsService } from '../services/hotels.service.ts';
import type { PlansService } from '../services/plans.service.ts';
import type { ProfileService } from '../services/profile.service.ts';
import type { TripsService } from '../services/trips.service.ts';
import { createDestinationsRouter } from './destinations.routes.ts';
import { createFlightsRouter } from './flights.routes.ts';
import { createGeoRouter } from './geo.routes.ts';
import { createHotelsRouter } from './hotels.routes.ts';
import { createMeRouter } from './me.routes.ts';
import { createPlansRouter } from './plans.routes.ts';
import { createTripsRouter } from './trips.routes.ts';

export type Services = {
  readonly profiles: ProfileService;
  readonly geo: GeoService;
  readonly destinations: DestinationsService;
  readonly hotels: HotelsService;
  readonly flights: FlightsService;
  readonly trips: TripsService;
  readonly plans: PlansService;
};

/** Every route that needs a signed-in traveler, behind `requireUser`. */
export const createApiRouter = (
  services: Services,
  requireUser: RequestHandler,
): Router =>
  Router()
    .use(requireUser)
    .use(createMeRouter(createMeController(services.profiles)))
    .use(createGeoRouter(createGeoController(services.geo)))
    .use(
      createDestinationsRouter(
        createDestinationsController(services.destinations),
      ),
    )
    .use(createHotelsRouter(createHotelsController(services.hotels)))
    .use(createFlightsRouter(createFlightsController(services.flights)))
    .use(createTripsRouter(createTripsController(services.trips)))
    .use(createPlansRouter(createPlansController(services.plans)));
