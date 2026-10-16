import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'trips' })
@Index('trips_user_id_updated_at_idx', ['userId', 'updatedAt'])
export class TripEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  /** `draft | planned | booked`. `past` is derived on read from `end_date`. */
  @Column('text')
  status!: string;

  @Column('text', { array: true, default: () => "'{}'" })
  styles!: string[];

  @Column('text')
  pace!: string;

  @Column('text', { name: 'destination_id', nullable: true })
  destinationId!: string | null;

  @Column('text', { name: 'destination_name', nullable: true })
  destinationName!: string | null;

  @Column('date', { name: 'start_date', nullable: true })
  startDate!: string | null;

  @Column('date', { name: 'end_date', nullable: true })
  endDate!: string | null;

  @Column('text', { name: 'origin_airport', nullable: true })
  originAirport!: string | null;

  @Column('int')
  adults!: number;

  @Column('int', { name: 'children_ages', array: true, default: () => "'{}'" })
  childrenAges!: number[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
