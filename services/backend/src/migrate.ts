import 'reflect-metadata';
import { createDataSource } from './db/dataSource.ts';
import { parseDbEnv } from './env.ts';
import { createLogger } from './observability/logger.ts';
import { serializeError } from './observability/serializeError.ts';

// Runs pending migrations, then exits. Point DATABASE_URL at Supabase's
// direct (non-pooled) URL when running this against the cloud.
const env = parseDbEnv();
const logger = createLogger({ level: env.LOG_LEVEL, format: env.LOG_FORMAT });
const dataSource = createDataSource({
  url: env.DATABASE_URL,
  schema: env.DATABASE_SCHEMA,
  logger,
});

try {
  await dataSource.initialize();
  // The migrations table lives in the schema, so it must exist first.
  await dataSource.query(
    `CREATE SCHEMA IF NOT EXISTS "${env.DATABASE_SCHEMA}"`,
  );
  const applied = await dataSource.runMigrations({ transaction: 'each' });

  logger.info('migrations done', { applied: applied.map((m) => m.name) });
} catch (error) {
  logger.error('migrations failed', { error: serializeError(error) });
  process.exitCode = 1;
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
