import type {
  Fee,
  OpeningHours,
  Photo,
} from '@waypoint/contracts/destinations';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { SpotStatus } from './status.ts';

/**
 * A place worth visiting. Research writes drafts; a reviewer publishes them.
 * Every fact's origin is in `spot_sources`.
 */
@Entity({ name: 'spots' })
@Index('spots_destination_status_idx', ['destinationId', 'status'])
export class SpotEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { name: 'destination_id' })
  destinationId!: string;

  /** Only published spots leave the API. */
  @Column('text')
  status!: SpotStatus;

  /** Wikidata item id (e.g. `Q215003`) — how research recognises a spot it has seen. */
  @Column('text', { name: 'wikidata_id', nullable: true, unique: true })
  wikidataId!: string | null;

  @Column('text', { name: 'google_place_id', nullable: true })
  googlePlaceId!: string | null;

  @Column('text')
  name!: string;

  @Column('text')
  category!: string;

  @Column('text', { array: true, default: () => "'{}'" })
  styles!: string[];

  @Column('double precision')
  lat!: number;

  @Column('double precision')
  lng!: number;

  @Column('text', { nullable: true })
  address!: string | null;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('text', { nullable: true })
  website!: string | null;

  @Column('int', { name: 'visit_minutes' })
  visitMinutes!: number;

  @Column('int')
  popularity!: number;

  @Column('jsonb', { nullable: true })
  photo!: Photo | null;

  @Column('jsonb', { name: 'opening_hours', nullable: true })
  openingHours!: OpeningHours | null;

  @Column('jsonb')
  fee!: Fee;

  @Column('timestamptz', { name: 'checked_at' })
  checkedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
