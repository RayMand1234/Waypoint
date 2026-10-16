import type { StopKind, TravelMode } from '@waypoint/contracts/trips';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'trip_stops' })
export class TripStopEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'day_id' })
  dayId!: string;

  @Column('int')
  position!: number;

  @Column('text')
  kind!: StopKind;

  /** `null` for the fixed moments (landing, lunch, …). */
  @Column('text', { name: 'spot_id', nullable: true })
  spotId!: string | null;

  @Column('text')
  name!: string;

  @Column('double precision', { nullable: true })
  lat!: number | null;

  @Column('double precision', { nullable: true })
  lng!: number | null;

  /** Postgres returns `HH:MM:SS`; the API speaks `HH:MM`. */
  @Column('time', { name: 'starts_at' })
  startsAt!: string;

  @Column('int')
  minutes!: number;

  @Column('int', { name: 'travel_minutes_from_previous', nullable: true })
  travelMinutesFromPrevious!: number | null;

  @Column('text', { name: 'travel_mode', nullable: true })
  travelMode!: TravelMode | null;

  @Column('boolean', { name: 'is_fixed' })
  isFixed!: boolean;
}
