import { ok, type Result } from '@waypoint/contracts/common';
import type { Profile, UpdateMeRequest } from '@waypoint/contracts/trips';
import type { UserId } from '../domain/userId.ts';
import type { ProfileRepository } from '../repositories/profile.repository.ts';
import type { ServiceError } from './errors.ts';

export type ProfileService = {
  /** Creates the profile on the user's first call. */
  readonly me: (userId: UserId) => Promise<Result<Profile, ServiceError>>;
  readonly update: (
    userId: UserId,
    patch: UpdateMeRequest,
  ) => Promise<Result<Profile, ServiceError>>;
};

export const createProfileService = ({
  profiles,
}: {
  readonly profiles: ProfileRepository;
}): ProfileService => ({
  me: async (userId) => ok(await profiles.ensure(userId)),
  update: async (userId, patch) => ok(await profiles.update(userId, patch)),
});
