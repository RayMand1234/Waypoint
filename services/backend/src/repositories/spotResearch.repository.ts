import type { Photo } from '@waypoint/contracts/destinations';
import type { DataSource, EntityManager } from 'typeorm';
import {
  DestinationEntity,
  SpotEntity,
  SpotSourceEntity,
} from '../entities/index.ts';
import { DESTINATION_STATUS, SPOT_STATUS } from '../entities/status.ts';
import type { CityDefinition } from '../research/cities.ts';
import type { SpotDraft } from '../research/draft.ts';

// Write side for research. A spot is recognised by its Wikidata id: the first
// run inserts it as a draft; later runs refresh only the facts that change
// (popularity, hours, fee, photo, address, website) and never overwrite what
// a reviewer owns (name, category, styles, visit length, description, status).

export type SaveOutcome = 'created' | 'refreshed';

export type SpotResearchRepository = {
  readonly saveDestination: (
    city: CityDefinition,
    photo: Photo | null,
  ) => Promise<void>;
  readonly saveSpot: (
    destinationId: string,
    draft: SpotDraft,
    checkedAt: Date,
  ) => Promise<SaveOutcome>;
  /** Publishes the destination and every spot still in draft; returns how many spots. */
  readonly publish: (destinationId: string) => Promise<number>;
};

const writeSources = async (
  manager: EntityManager,
  spotId: string,
  draft: SpotDraft,
  fetchedAt: Date,
): Promise<void> => {
  if (draft.sources.length === 0) return;

  await manager.upsert(
    SpotSourceEntity,
    draft.sources.map((source) => ({ spotId, ...source, fetchedAt })),
    ['spotId', 'field'],
  );
};

export const createSpotResearchRepository = (
  dataSource: DataSource,
): SpotResearchRepository => ({
  saveDestination: async (city, photo) => {
    await dataSource.getRepository(DestinationEntity).upsert(
      {
        id: city.id,
        name: city.name,
        countryCode: city.countryCode,
        countryName: city.countryName,
        airport: city.airport,
        lat: city.lat,
        lng: city.lng,
        styles: [...city.styles],
        photo,
      },
      ['id'],
    );
  },

  saveSpot: (destinationId, draft, checkedAt) =>
    dataSource.transaction(async (manager) => {
      const existing = await manager.findOneBy(SpotEntity, {
        wikidataId: draft.wikidataId,
      });
      const refreshable = {
        popularity: draft.popularity,
        photo: draft.photo,
        openingHours: draft.openingHours,
        fee: draft.fee,
        address: draft.address,
        website: draft.website,
        lat: draft.lat,
        lng: draft.lng,
        checkedAt,
      };

      if (existing !== null) {
        await manager.update(SpotEntity, { id: existing.id }, refreshable);
        await writeSources(manager, existing.id, draft, checkedAt);

        return 'refreshed';
      }

      const created = await manager.save(
        manager.create(SpotEntity, {
          ...refreshable,
          destinationId,
          status: SPOT_STATUS.draft,
          wikidataId: draft.wikidataId,
          googlePlaceId: null,
          name: draft.name,
          category: draft.category,
          styles: [...draft.styles],
          description: draft.description,
          visitMinutes: draft.visitMinutes,
        }),
      );

      await writeSources(manager, created.id, draft, checkedAt);

      return 'created';
    }),

  publish: (destinationId) =>
    dataSource.transaction(async (manager) => {
      await manager.update(
        DestinationEntity,
        { id: destinationId },
        { status: DESTINATION_STATUS.published },
      );

      const result = await manager.update(
        SpotEntity,
        { destinationId, status: SPOT_STATUS.draft },
        { status: SPOT_STATUS.published },
      );

      return result.affected ?? 0;
    }),
});
