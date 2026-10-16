import { Column, Entity, PrimaryColumn } from 'typeorm';

/** A spot the traveler picked, stored by value. Rows go when the trip does (FK cascade). */
@Entity({ name: 'trip_spots' })
export class TripSpotEntity {
  @PrimaryColumn('uuid', { name: 'trip_id' })
  tripId!: string;

  @PrimaryColumn('text', { name: 'spot_id' })
  spotId!: string;

  @Column('int')
  position!: number;

  @Column('text')
  name!: string;
}
