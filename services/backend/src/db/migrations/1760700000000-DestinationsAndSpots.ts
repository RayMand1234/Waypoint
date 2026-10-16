import type { MigrationInterface, QueryRunner } from 'typeorm';
import { schemaOf } from './schemaOf.ts';

/** Curated destinations, researched spots, and where each spot fact came from. */
export class DestinationsAndSpots1760700000000 implements MigrationInterface {
  name = 'DestinationsAndSpots1760700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    await queryRunner.query(`
      CREATE TABLE "${s}"."destinations" (
        "id" text PRIMARY KEY CHECK ("id" ~ '^[a-z0-9-]+$'),
        "name" text NOT NULL,
        "country_code" text NOT NULL CHECK ("country_code" ~ '^[A-Z]{2}$'),
        "country_name" text NOT NULL,
        "airport" text NOT NULL CHECK ("airport" ~ '^[A-Z]{3}$'),
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "place_id" text,
        "styles" text[] NOT NULL DEFAULT '{}',
        "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'published')),
        "photo" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);

    await queryRunner.query(`
      CREATE TABLE "${s}"."spots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "destination_id" text NOT NULL REFERENCES "${s}"."destinations" ("id") ON DELETE CASCADE,
        "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'review', 'published', 'rejected')),
        "wikidata_id" text UNIQUE,
        "google_place_id" text,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "styles" text[] NOT NULL DEFAULT '{}',
        "lat" double precision NOT NULL,
        "lng" double precision NOT NULL,
        "address" text,
        "description" text,
        "website" text,
        "visit_minutes" int NOT NULL CHECK ("visit_minutes" > 0),
        "popularity" int NOT NULL CHECK ("popularity" BETWEEN 0 AND 100),
        "photo" jsonb,
        "opening_hours" jsonb,
        "fee" jsonb NOT NULL DEFAULT '{"kind":"unknown"}',
        "checked_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )`);
    await queryRunner.query(
      `CREATE INDEX "spots_destination_status_idx" ON "${s}"."spots" ("destination_id", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE "${s}"."spot_sources" (
        "spot_id" uuid NOT NULL REFERENCES "${s}"."spots" ("id") ON DELETE CASCADE,
        "field" text NOT NULL,
        "source" text NOT NULL,
        "source_ref" text,
        "url" text,
        "license" text,
        "fetched_at" timestamptz NOT NULL,
        PRIMARY KEY ("spot_id", "field")
      )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const s = schemaOf(queryRunner);

    for (const table of ['spot_sources', 'spots', 'destinations']) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${s}"."${table}"`);
    }
  }
}
