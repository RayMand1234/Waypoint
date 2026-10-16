import type { Photo } from '@waypoint/contracts/destinations';
import type { DestinationStatus } from './status.ts';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** A curated city, or one added from search. Its spots are researched separately (see `research/`). */
@Entity({ name: 'destinations' })
export class DestinationEntity {
  /** Slug, e.g. `lisbon`. */
  @PrimaryColumn('text')
  id!: string;

  @Column('text')
  name!: string;

  @Column('text', { name: 'country_code' })
  countryCode!: string;

  @Column('text', { name: 'country_name' })
  countryName!: string;

  @Column('text')
  airport!: string;

  @Column('double precision')
  lat!: number;

  @Column('double precision')
  lng!: number;

  @Column('text', { name: 'place_id', nullable: true })
  placeId!: string | null;

  @Column('text', { array: true, default: () => "'{}'" })
  styles!: string[];

  /** Published and searched ones are offered. */
  @Column('text')
  status!: DestinationStatus;

  @Column('jsonb', { nullable: true })
  photo!: Photo | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
