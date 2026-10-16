import type { MigrationInterface, QueryRunner } from 'typeorm';
import { schemaOf } from './schemaOf.ts';

/**
 * The planner's day plan: a stop is a spot or a fixed moment around the spots
 * (landing, check-in, lunch, the airport run, the flight home), so only spot
 * stops carry a spot and a place. Stops say how you got there; days get a title.
 */
export class PlanStops1761000000000 implements MigrationInterface {
  name = 'PlanStops1761000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(`
      ALTER TABLE "${s}"."trip_stops"
        ADD COLUMN "kind" text NOT NULL DEFAULT 'spot'
          CONSTRAINT "trip_stops_kind_check"
          CHECK ("kind" IN ('spot', 'arrival', 'check-in', 'lunch', 'to-airport', 'departure')),
        ADD COLUMN "travel_mode" text
          CONSTRAINT "trip_stops_travel_mode_check"
          CHECK ("travel_mode" IN ('walk', 'transit')),
        ALTER COLUMN "spot_id" DROP NOT NULL,
        ALTER COLUMN "lat" DROP NOT NULL,
        ALTER COLUMN "lng" DROP NOT NULL,
        ADD CONSTRAINT "trip_stops_spot_check"
          CHECK ("kind" <> 'spot' OR ("spot_id" IS NOT NULL AND "lat" IS NOT NULL AND "lng" IS NOT NULL))`);
    await queryRunner.query(
      `ALTER TABLE "${s}"."trip_days" ADD COLUMN "title" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(
      `ALTER TABLE "${s}"."trip_days" DROP COLUMN "title"`,
    );
    await queryRunner.query(
      `DELETE FROM "${s}"."trip_stops" WHERE "kind" <> 'spot'`,
    );
    await queryRunner.query(`
      ALTER TABLE "${s}"."trip_stops"
        DROP CONSTRAINT "trip_stops_spot_check",
        DROP COLUMN "travel_mode",
        DROP COLUMN "kind",
        ALTER COLUMN "spot_id" SET NOT NULL,
        ALTER COLUMN "lat" SET NOT NULL,
        ALTER COLUMN "lng" SET NOT NULL`);
  }
}
