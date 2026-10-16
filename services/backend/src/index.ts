import 'reflect-metadata';
import { createApp } from './app.ts';
import { createDataSource } from './db/dataSource.ts';
import { parseEnv } from './env.ts';
import { requireUser } from './middleware/requireUser.ts';
import { createLogger } from './observability/logger.ts';
import { serializeError } from './observability/serializeError.ts';
import { createTracedFetch } from './observability/tracedFetch.ts';
import { createLiteApiClient } from './providers/liteapi/client.ts';
import { createLiteApiFlightProvider } from './providers/liteapi/flights.ts';
import { createLiteApiGeo } from './providers/liteapi/geo.ts';
import {
  createLiteApiHotelCatalog,
  createLiteApiHotelProvider,
} from './providers/liteapi/hotels.ts';
import { createGooglePlaces } from './providers/google/places.ts';
import { createCacheRepository } from './repositories/cache.repository.ts';
import { createDestinationsRepository } from './repositories/destinations.repository.ts';
import { createProfileRepository } from './repositories/profile.repository.ts';
import { createTripsRepository } from './repositories/trips.repository.ts';
import { createCached } from './services/cache.service.ts';
import { createFlightsService } from './services/flights.service.ts';
import { createDestinationsService } from './services/destinations.service.ts';
import { createGeoService } from './services/geo.service.ts';
import { createHotelsService } from './services/hotels.service.ts';
import { createPlansService } from './services/plans.service.ts';
import { createProfileService } from './services/profile.service.ts';
import { createTripsService } from './services/trips.service.ts';

// Composition root: parse env → build dependencies → createApp → listen.
// Nothing else in the service reads the environment or builds a singleton.

const env = parseEnv();
const logger = createLogger({ level: env.LOG_LEVEL, format: env.LOG_FORMAT });
const now = (): Date => new Date();

const dataSource = createDataSource({
  url: env.DATABASE_URL,
  schema: env.DATABASE_SCHEMA,
  logger,
});

await dataSource.initialize();

const liteApi = createLiteApiClient({
  apiKey: env.LITEAPI_KEY,
  baseUrl: env.LITEAPI_BASE_URL,
  timeoutMs: env.LITEAPI_TIMEOUT_MS,
  fetch: createTracedFetch({ logger, upstream: 'liteapi' }),
});
// Outside production the white-label site is optional; links then point at a
// reserved `.invalid` host that can never resolve to a real site.
const PLACEHOLDER_WHITELABEL_URL = 'https://whitelabel.invalid';

if (env.LITEAPI_WHITELABEL_URL === undefined) {
  logger.warn(
    'LITEAPI_WHITELABEL_URL is not set: booking links use a placeholder',
    {
      placeholder: PLACEHOLDER_WHITELABEL_URL,
    },
  );
}

const liteApiDeps = {
  client: liteApi,
  logger,
  whitelabelUrl: env.LITEAPI_WHITELABEL_URL ?? PLACEHOLDER_WHITELABEL_URL,
  now,
};
const cached = createCached({
  cache: createCacheRepository(dataSource),
  now,
  logger,
});

const tripsRepository = createTripsRepository(dataSource);
const destinationsRepository = createDestinationsRepository(dataSource);
const geo = createGeoService({ source: createLiteApiGeo(liteApiDeps), cached });

if (env.GOOGLE_PLACES_API_KEY === undefined) {
  logger.warn('GOOGLE_PLACES_API_KEY is not set: spot ratings are unavailable');
}

const app = createApp({
  services: {
    profiles: createProfileService({
      profiles: createProfileRepository(dataSource),
    }),
    geo,
    destinations: createDestinationsService({
      destinations: destinationsRepository,
      geo,
      places:
        env.GOOGLE_PLACES_API_KEY === undefined
          ? undefined
          : createGooglePlaces({
              apiKey: env.GOOGLE_PLACES_API_KEY,
              fetch: createTracedFetch({ logger, upstream: 'google-places' }),
            }),
    }),
    hotels: createHotelsService({
      catalog: createLiteApiHotelCatalog(liteApiDeps),
      // Adding a hotel source = one adapter + one entry here.
      providers: [createLiteApiHotelProvider(liteApiDeps)],
      cached,
      logger,
    }),
    flights: createFlightsService({
      providers: [createLiteApiFlightProvider(liteApiDeps)],
      cached,
      logger,
    }),
    trips: createTripsService({ trips: tripsRepository, now }),
    plans: createPlansService({
      trips: tripsRepository,
      destinations: destinationsRepository,
    }),
  },
  requireUser: requireUser({ supabaseUrl: env.SUPABASE_URL, logger }),
  logger,
  now,
});

const server = app.listen(env.PORT, () => {
  logger.info('backend listening', { port: env.PORT, env: env.NODE_ENV });
});

const shutdown = (signal: string): void => {
  logger.info('shutting down', { signal });
  server.close(() => {
    void dataSource.destroy().finally(() => process.exit());
  });
};

// A rejection nobody handled is a bug that leaves the process in an unknown
// state: log it and shut down, so the host restarts a clean instance.
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', { error: serializeError(reason) });
  process.exitCode = 1;
  shutdown('unhandledRejection');
});
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});
