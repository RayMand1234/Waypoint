import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'trip_days' })
export class TripDayEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'trip_id' })
  tripId!: string;

  @Column('int', { name: 'day_index' })
  dayIndex!: number;

  @Column('date')
  date!: string;
}
