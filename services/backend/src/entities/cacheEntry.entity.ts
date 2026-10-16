import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Provider answers kept for a while — countries for weeks, hotel rates for
 * minutes — so repeated questions don't cost a provider call (or money).
 * `value` is already in Waypoint's own shape.
 */
@Entity({ name: 'cache_entries' })
@Index('cache_entries_expires_at_idx', ['expiresAt'])
export class CacheEntryEntity {
  @PrimaryColumn('text')
  key!: string;

  @Column('jsonb')
  value!: unknown;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;
}
