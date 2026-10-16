import type { MigrationInterface, QueryRunner } from 'typeorm';
import { schemaOf } from './schemaOf.ts';

/**
 * Destinations a traveler found by search: a third status beside the curated
 * `draft` / `published`, and at most one destination per Google place.
 */
export class SearchedDestinations1760800000000 implements MigrationInterface {
  name = 'SearchedDestinations1760800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(
      `ALTER TABLE "${s}"."destinations" DROP CONSTRAINT "destinations_status_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${s}"."destinations" ADD CONSTRAINT "destinations_status_check" CHECK ("status" IN ('draft', 'published', 'searched'))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "destinations_place_id_key" ON "${s}"."destinations" ("place_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(
      `DELETE FROM "${s}"."destinations" WHERE "status" = 'searched'`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "${s}"."destinations_place_id_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${s}"."destinations" DROP CONSTRAINT "destinations_status_check"`,
    );
    await queryRunner.query(
      `ALTER TABLE "${s}"."destinations" ADD CONSTRAINT "destinations_status_check" CHECK ("status" IN ('draft', 'published'))`,
    );
  }
}
