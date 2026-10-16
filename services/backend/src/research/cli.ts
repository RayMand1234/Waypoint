import 'reflect-metadata';
import { z } from 'zod';
import { createDataSource } from '../db/dataSource.ts';
import { parseDbEnv } from '../env.ts';
import { createLogger } from '../observability/logger.ts';
import { serializeError } from '../observability/serializeError.ts';
import { createTracedFetch } from '../observability/tracedFetch.ts';
import { createSpotResearchRepository } from '../repositories/spotResearch.repository.ts';
import { CITIES, findCity } from './cities.ts';
import { runResearch } from './runResearch.ts';

// npm run research -- <city>             drafts the city's spots for review
// npm run research -- <city> --publish   publishes the city and its remaining drafts

// Anything but these two shapes is refused, so a mistyped flag can't start a full crawl.
const argsSchema = z.union([
  z.tuple([z.string()]),
  z.tuple([z.string(), z.literal('--publish')]),
]);
const args = argsSchema.safeParse(process.argv.slice(2));
const city = args.success ? findCity(args.data[0]) : undefined;
const isPublish = args.success && args.data[1] === '--publish';

if (city === undefined) {
  console.error(
    `Usage: npm run research -- <city> [--publish]\nKnown cities: ${CITIES.map((c) => c.id).join(', ')}`,
  );
  process.exit(1);
}

const env = parseDbEnv();
const logger = createLogger({ level: env.LOG_LEVEL, format: env.LOG_FORMAT });
const dataSource = createDataSource({
  url: env.DATABASE_URL,
  schema: env.DATABASE_SCHEMA,
  logger,
});

try {
  await dataSource.initialize();

  const repository = createSpotResearchRepository(dataSource);

  if (isPublish) {
    const published = await repository.publish(city.id);

    logger.info('research: published', { city: city.id, spots: published });
  } else {
    const summary = await runResearch({
      city,
      fetch: createTracedFetch({ logger, upstream: 'research' }),
      repository,
      logger,
      now: () => new Date(),
    });

    if (summary.ok) {
      logger.info(
        'research: done — review drafts in Supabase Studio, then run with --publish',
        { city: city.id, ...summary.value },
      );
    } else {
      logger.error('research failed', { city: city.id, error: summary.error });
      process.exitCode = 1;
    }
  }
} catch (error) {
  logger.error('research failed', { error: serializeError(error) });
  process.exitCode = 1;
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}
