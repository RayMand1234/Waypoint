import { CacheEntryEntity } from './cacheEntry.entity.ts';
import { DestinationEntity } from './destination.entity.ts';
import { SpotEntity } from './spot.entity.ts';
import { SpotSourceEntity } from './spotSource.entity.ts';
import { ProfileEntity } from './profile.entity.ts';
import { TripEntity } from './trip.entity.ts';
import { TripDayEntity } from './tripDay.entity.ts';
import { TripSelectionEntity } from './tripSelection.entity.ts';
import { TripSpotEntity } from './tripSpot.entity.ts';
import { TripStopEntity } from './tripStop.entity.ts';

export {
  CacheEntryEntity,
  DestinationEntity,
  SpotEntity,
  SpotSourceEntity,
  ProfileEntity,
  TripDayEntity,
  TripEntity,
  TripSelectionEntity,
  TripSpotEntity,
  TripStopEntity,
};

export const entities = [
  CacheEntryEntity,
  DestinationEntity,
  SpotEntity,
  SpotSourceEntity,
  ProfileEntity,
  TripEntity,
  TripDayEntity,
  TripSelectionEntity,
  TripSpotEntity,
  TripStopEntity,
];
