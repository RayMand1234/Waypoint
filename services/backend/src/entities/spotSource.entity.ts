import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Where one fact about a spot came from — for credits, re-checks and takedowns. */
@Entity({ name: 'spot_sources' })
export class SpotSourceEntity {
  @PrimaryColumn('uuid', { name: 'spot_id' })
  spotId!: string;

  /** Which fact: `identity`, `photo`, `hours`, `fee`, `popularity`, … */
  @PrimaryColumn('text')
  field!: string;

  /** `wikidata | openstreetmap | wikipedia | wikimedia-commons | google | manual`. */
  @Column('text')
  source!: string;

  @Column('text', { name: 'source_ref', nullable: true })
  sourceRef!: string | null;

  @Column('text', { nullable: true })
  url!: string | null;

  @Column('text', { nullable: true })
  license!: string | null;

  @Column('timestamptz', { name: 'fetched_at' })
  fetchedAt!: Date;
}
