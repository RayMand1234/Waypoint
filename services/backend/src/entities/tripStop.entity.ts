import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'trip_stops' })
export class TripStopEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'day_id' })
  dayId!: string;

  @Column('int')
  position!: number;

  @Column('text', { name: 'spot_id' })
  spotId!: string;

  @Column('text')
  name!: string;

  @Column('double precision')
  lat!: number;

  @Column('double precision')
  lng!: number;

  /** Postgres returns `HH:MM:SS`; the API speaks `HH:MM`. */
  @Column('time', { name: 'starts_at' })
  startsAt!: string;

  @Column('int')
  minutes!: number;

  @Column('int', { name: 'travel_minutes_from_previous', nullable: true })
  travelMinutesFromPrevious!: number | null;

  @Column('boolean', { name: 'is_fixed' })
  isFixed!: boolean;
}
