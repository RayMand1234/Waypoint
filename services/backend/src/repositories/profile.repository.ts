import {
  profileSchema,
  type Profile,
  type UpdateMeRequest,
} from '@waypoint/contracts/trips';
import type { DataSource } from 'typeorm';
import { ProfileEntity } from '../entities/index.ts';
import type { UserId } from '../domain/userId.ts';

/** What a traveler may change about themselves: name, home airport, currency. */
export type ProfileChanges = UpdateMeRequest;

export type ProfileRepository = {
  /** The profile, created on the user's first request (insert-if-missing). */
  readonly ensure: (userId: UserId) => Promise<Profile>;
  readonly update: (
    userId: UserId,
    changes: ProfileChanges,
  ) => Promise<Profile>;
};

const toProfile = (entity: ProfileEntity): Profile =>
  profileSchema.parse({
    userId: entity.userId,
    name: entity.name,
    homeAirport: entity.homeAirport,
    currency: entity.currency,
    createdAt: entity.createdAt.toISOString(),
  });

export const createProfileRepository = (
  dataSource: DataSource,
): ProfileRepository => {
  const repo = dataSource.getRepository(ProfileEntity);

  const ensure = async (userId: UserId): Promise<Profile> => {
    await repo
      .createQueryBuilder()
      .insert()
      .values({ userId, name: null, homeAirport: null })
      .orIgnore()
      .execute();

    return toProfile(await repo.findOneByOrFail({ userId }));
  };

  return {
    ensure,
    update: async (userId, changes) => {
      await ensure(userId);

      if (Object.keys(changes).length > 0)
        await repo.update({ userId }, changes);

      return toProfile(await repo.findOneByOrFail({ userId }));
    },
  };
};
