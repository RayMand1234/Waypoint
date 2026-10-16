import type { MigrationInterface, QueryRunner } from 'typeorm';
import { schemaOf } from './schemaOf.ts';

/**
 * Trips: where the flights leave from, and one age per child (searches need
 * ages, not a count). Profiles: the currency every price is shown in.
 */
export class TravelersAndCurrency1760640000000 implements MigrationInterface {
  name = 'TravelersAndCurrency1760640000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(`
      ALTER TABLE "${s}"."profiles"
        ADD COLUMN "currency" text NOT NULL DEFAULT 'EUR' CHECK ("currency" IN ('EUR', 'USD', 'GBP', 'ILS'))`);
    await queryRunner.query(`
      ALTER TABLE "${s}"."trips"
        ADD COLUMN "origin_airport" text CHECK ("origin_airport" ~ '^[A-Z]{3}$'),
        ADD COLUMN "children_ages" int[] NOT NULL DEFAULT '{}'`);
    // Existing trips only had a count; their children get a placeholder age (8)
    // the traveler can correct in the Spots & dates step.
    await queryRunner.query(`
      UPDATE "${s}"."trips" SET "children_ages" = array_fill(8, ARRAY["children"]) WHERE "children" > 0`);
    await queryRunner.query(
      `ALTER TABLE "${s}"."trips" DROP COLUMN "children"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(`
      ALTER TABLE "${s}"."trips" ADD COLUMN "children" int NOT NULL DEFAULT 0 CHECK ("children" >= 0)`);
    await queryRunner.query(`
      UPDATE "${s}"."trips" SET "children" = coalesce(array_length("children_ages", 1), 0)`);
    await queryRunner.query(`
      ALTER TABLE "${s}"."trips" DROP COLUMN "children_ages", DROP COLUMN "origin_airport"`);
    await queryRunner.query(
      `ALTER TABLE "${s}"."profiles" DROP COLUMN "currency"`,
    );
  }
}
