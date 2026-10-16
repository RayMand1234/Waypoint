import type { QueryRunner } from 'typeorm';

/**
 * The Postgres schema this data source is pointed at. Migrations qualify every
 * table with it, since raw SQL follows `search_path`, not TypeORM's option.
 */
export const schemaOf = (queryRunner: QueryRunner): string => {
  const { options } = queryRunner.dataSource;

  if (options.type !== 'postgres' || options.schema === undefined) {
    throw new Error('migrations need a postgres data source with a schema');
  }

  return options.schema;
};
