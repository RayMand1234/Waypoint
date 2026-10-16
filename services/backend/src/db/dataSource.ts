import { DataSource } from 'typeorm';
import { entities } from '../entities/index.ts';
import type { Logger } from '../observability/logger.ts';
import { Init1760550000000 } from './migrations/1760550000000-Init.ts';
import { TravelersAndCurrency1760640000000 } from './migrations/1760640000000-TravelersAndCurrency.ts';
import { DestinationsAndSpots1760700000000 } from './migrations/1760700000000-DestinationsAndSpots.ts';
import { SearchedDestinations1760800000000 } from './migrations/1760800000000-SearchedDestinations.ts';
import { PlanStops1761000000000 } from './migrations/1761000000000-PlanStops.ts';
import { createTypeOrmLogger } from './typeormLogger.ts';

const SLOW_QUERY_MS = 500;

/**
 * The one TypeORM connection for this service, pointed at its own Postgres
 * schema. Use Supabase's pooled URL at runtime and the direct URL for
 * migrations. The schema is never synchronised — migrations own it.
 */
export const createDataSource = ({
  url,
  schema,
  logger,
}: {
  readonly url: string;
  readonly schema: string;
  readonly logger: Logger;
}): DataSource =>
  new DataSource({
    type: 'postgres',
    url,
    schema,
    entities,
    migrations: [
      Init1760550000000,
      TravelersAndCurrency1760640000000,
      DestinationsAndSpots1760700000000,
      SearchedDestinations1760800000000,
      PlanStops1761000000000,
    ],
    migrationsTableName: 'migrations',
    synchronize: false,
    logging: true,
    logger: createTypeOrmLogger(logger),
    maxQueryExecutionTime: SLOW_QUERY_MS,
  });
