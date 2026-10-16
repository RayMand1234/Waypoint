import {
  destinationSchema,
  spotSchema,
  type Destination,
  type Spot,
} from '@waypoint/contracts/destinations';
import { In, type DataSource } from 'typeorm';
import { z } from 'zod';
import { DestinationEntity, SpotEntity } from '../entities/index.ts';
import { DESTINATION_STATUS, SPOT_STATUS } from '../entities/status.ts';

// The API's side of destinations: curated (published) ones and those added
// from a traveler's search; drafts never leave here. Rows come back parsed
// into contract types, never as entities.

/** Destinations a trip may go to: curated, or added from search. */
const OFFERED_STATUSES = [
  DESTINATION_STATUS.published,
  DESTINATION_STATUS.searched,
];
const OFFERED = In(OFFERED_STATUSES);
const spotCountRowsSchema = z.array(
  z.object({ destinationId: z.string(), count: z.number().int().min(0) }),
);

/** Whether a spot can have a live Google rating. */
export type SpotPlaceId =
  | { readonly kind: 'not-found' }
  | { readonly kind: 'no-place' }
  | { readonly kind: 'place'; readonly placeId: string };

/** A city found by search, to add as a destination. */
export type SearchedDestination = Omit<
  Destination,
  'styles' | 'photo' | 'spotCount'
> & {
  readonly placeId: string;
};

export type DestinationsRepository = {
  readonly listPublished: () => Promise<Destination[]>;
  /** A curated or searched destination — the ones a trip may go to. */
  readonly findOffered: (id: string) => Promise<Destination | undefined>;
  /**
   * The destination for a searched city: by its place id, else a curated one
   * with the same name and country that has no place id yet.
   */
  readonly findForPlace: (place: {
    readonly placeId: string;
    readonly name: string;
    readonly countryCode: string;
  }) => Promise<Destination | undefined>;
  /** Adds a city found by search; a concurrent add of the same place or id is a no-op. */
  readonly addSearched: (destination: SearchedDestination) => Promise<void>;
  readonly spotsOf: (destinationId: string) => Promise<Spot[]>;
  readonly findSpot: (spotId: string) => Promise<Spot | undefined>;
  /** The Google place id of a published spot, for its live rating. */
  readonly googlePlaceIdOf: (spotId: string) => Promise<SpotPlaceId>;
};

const toDestination = (
  entity: DestinationEntity,
  spotCount: number,
): Destination =>
  destinationSchema.parse({
    id: entity.id,
    name: entity.name,
    countryCode: entity.countryCode,
    countryName: entity.countryName,
    airport: entity.airport,
    lat: entity.lat,
    lng: entity.lng,
    placeId: entity.placeId,
    styles: entity.styles,
    photo: entity.photo,
    spotCount,
  });

const toSpot = (entity: SpotEntity): Spot =>
  spotSchema.parse({
    id: entity.id,
    destinationId: entity.destinationId,
    name: entity.name,
    category: entity.category,
    styles: entity.styles,
    lat: entity.lat,
    lng: entity.lng,
    address: entity.address,
    description: entity.description,
    website: entity.website,
    visitMinutes: entity.visitMinutes,
    popularity: entity.popularity,
    photo: entity.photo,
    openingHours: entity.openingHours,
    fee: entity.fee,
    hasRating: entity.googlePlaceId !== null,
    checkedAt: entity.checkedAt.toISOString(),
  });

export const createDestinationsRepository = (
  dataSource: DataSource,
): DestinationsRepository => {
  const destinations = dataSource.getRepository(DestinationEntity);
  const spots = dataSource.getRepository(SpotEntity);

  const publishedSpotCounts = async (): Promise<
    ReadonlyMap<string, number>
  > => {
    const rows = spotCountRowsSchema.parse(
      await spots
        .createQueryBuilder('spot')
        .select('spot.destination_id', 'destinationId')
        .addSelect('count(*)::int', 'count')
        .where('spot.status = :status', { status: SPOT_STATUS.published })
        .groupBy('spot.destination_id')
        .getRawMany(),
    );

    return new Map(rows.map((row) => [row.destinationId, row.count]));
  };

  return {
    listPublished: async () => {
      const [rows, counts] = await Promise.all([
        destinations.find({
          where: { status: DESTINATION_STATUS.published },
          order: { name: 'ASC' },
        }),
        publishedSpotCounts(),
      ]);

      return rows.map((row) => toDestination(row, counts.get(row.id) ?? 0));
    },

    findOffered: async (id) => {
      const row = await destinations.findOneBy({ id, status: OFFERED });

      if (row === null) return undefined;

      return toDestination(
        row,
        await spots.countBy({
          destinationId: id,
          status: SPOT_STATUS.published,
        }),
      );
    },

    findForPlace: async ({ placeId, name, countryCode }) => {
      const row = await destinations
        .createQueryBuilder('destination')
        .where('destination.status IN (:...offered)', {
          offered: OFFERED_STATUSES,
        })
        .andWhere(
          '(destination.place_id = :placeId OR (destination.place_id IS NULL AND lower(destination.name) = lower(:name) AND destination.country_code = :countryCode))',
          { placeId, name, countryCode },
        )
        // A curated destination wins over one added from search.
        .orderBy(
          `destination.status = '${DESTINATION_STATUS.published}'`,
          'DESC',
        )
        .getOne();

      if (row === null) return undefined;

      return toDestination(
        row,
        await spots.countBy({
          destinationId: row.id,
          status: SPOT_STATUS.published,
        }),
      );
    },

    addSearched: async (destination) => {
      await destinations
        .createQueryBuilder()
        .insert()
        .values({
          ...destination,
          styles: [],
          photo: null,
          status: DESTINATION_STATUS.searched,
        })
        .orIgnore()
        .execute();
    },

    spotsOf: async (destinationId) =>
      (
        await spots.find({
          where: { destinationId, status: SPOT_STATUS.published },
          order: { popularity: 'DESC' },
        })
      ).map(toSpot),

    findSpot: async (spotId) => {
      const row = await spots.findOneBy({
        id: spotId,
        status: SPOT_STATUS.published,
      });

      return row === null ? undefined : toSpot(row);
    },

    googlePlaceIdOf: async (spotId) => {
      // The id is selected too: TypeORM returns no row when every selected column is null.
      const row = await spots.findOne({
        select: { id: true, googlePlaceId: true },
        where: { id: spotId, status: SPOT_STATUS.published },
      });

      if (row === null) return { kind: 'not-found' };

      return row.googlePlaceId === null
        ? { kind: 'no-place' }
        : { kind: 'place', placeId: row.googlePlaceId };
    },
  };
};
