import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Keyed by the Supabase user id (`auth.users.id` = JWT `sub`). Supabase owns `auth`. */
@Entity({ name: 'profiles' })
export class ProfileEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column('text', { nullable: true })
  name!: string | null;

  @Column('text', { name: 'home_airport', nullable: true })
  homeAirport!: string | null;

  @Column('text', { default: 'EUR' })
  currency!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
