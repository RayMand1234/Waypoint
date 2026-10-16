import { Column, Entity, PrimaryColumn } from 'typeorm';

/** The offer chosen for one part of a trip, snapshotted exactly as shown. */
@Entity({ name: 'trip_selections' })
export class TripSelectionEntity {
  @PrimaryColumn('uuid', { name: 'trip_id' })
  tripId!: string;

  /** `flight | stay | ticket` — one selection of each per trip. */
  @PrimaryColumn('text')
  kind!: string;

  @Column('jsonb', { name: 'offer_snapshot' })
  offerSnapshot!: Record<string, unknown>;

  @Column('text')
  provider!: string;

  @Column('text', { name: 'deep_link' })
  deepLink!: string;

  @Column('int', { name: 'price_minor' })
  priceMinor!: number;

  @Column('text')
  currency!: string;

  @Column('timestamptz', { name: 'checked_at' })
  checkedAt!: Date;

  @Column('timestamptz', { name: 'booked_at', nullable: true })
  bookedAt!: Date | null;
}
