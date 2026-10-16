import type { MigrationInterface, QueryRunner } from 'typeorm';
import { schemaOf } from './schemaOf.ts';

/** Profiles, trips (spots, days, stops, selections) and the provider cache. */
export class Init1760550000000 implements MigrationInterface {
  name = 'Init1760550000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(`
      CREATE TABLE "${s}"."profiles" (
        "user_id" uuid PRIMARY KEY,
        "name" text,
        "home_airport" text CHECK ("home_airport" ~ '^[A-Z]{3}$'),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."trips" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "status" text NOT NULL CHECK ("status" IN ('draft', 'planned', 'booked')),
        "styles" text[] NOT NULL DEFAULT '{}',
        "pace" text NOT NULL,
        "destination_id" text,
        "destination_name" text,
        "start_date" date,
        "end_date" date,
        "adults" int NOT NULL CHECK ("adults" >= 1),
        "children" int NOT NULL DEFAULT 0 CHECK ("children" >= 0),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "end_date" >= "start_date")
      )`);
    await queryRunner.query(
      `CREATE INDEX "trips_user_id_updated_at_idx" ON "${s}"."trips" ("user_id", "updated_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "${s}"."trip_spots" (
        "trip_id" uuid NOT NULL REFERENCES "${s}"."trips" ("id") ON DELETE CASCADE,
        "spot_id" text NOT NULL,
        "position" int NOT NULL,
        "name" text NOT NULL,
        PRIMARY KEY ("trip_id", "spot_id")
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."trip_days" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "trip_id" uuid NOT NULL REFERENCES "${s}"."trips" ("id") ON DELETE CASCADE,
        "day_index" int NOT NULL CHECK ("day_index" >= 0),
        "date" date NOT NULL,
        UNIQUE ("trip_id", "day_index")
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."trip_stops" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "day_id" uuid NOT NULL REFERENCES "${s}"."trip_days" ("id") ON DELETE CASCADE,
        "position" int NOT NULL CHECK ("position" >= 0),
        "spot_id" text NOT NULL,
        "name" text NOT NULL,
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "starts_at" time NOT NULL,
        "minutes" int NOT NULL CHECK ("minutes" >= 1),
        "travel_minutes_from_previous" int CHECK ("travel_minutes_from_previous" >= 0),
        "is_fixed" boolean NOT NULL DEFAULT false,
        UNIQUE ("day_id", "position")
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."trip_selections" (
        "trip_id" uuid NOT NULL REFERENCES "${s}"."trips" ("id") ON DELETE CASCADE,
        "kind" text NOT NULL CHECK ("kind" IN ('flight', 'stay', 'ticket')),
        "offer_snapshot" jsonb NOT NULL,
        "provider" text NOT NULL,
        "deep_link" text NOT NULL,
        "price_minor" int NOT NULL,
        "currency" text NOT NULL,
        "checked_at" timestamptz NOT NULL,
        "booked_at" timestamptz,
        PRIMARY KEY ("trip_id", "kind")
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."cache_entries" (
        "key" text PRIMARY KEY,
        "value" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "expires_at" timestamptz NOT NULL
      )`);
    await queryRunner.query(
      `CREATE INDEX "cache_entries_expires_at_idx" ON "${s}"."cache_entries" ("expires_at")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    for (const table of [
      'cache_entries',
      'trip_selections',
      'trip_stops',
      'trip_days',
      'trip_spots',
      'trips',
      'profiles',
    ]) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."${table}"`);
    }
  }
}
