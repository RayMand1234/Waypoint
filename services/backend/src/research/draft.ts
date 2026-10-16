import {
  spotSchema,
  type Fee,
  type OpeningHours,
  type Photo,
  type SpotCategory,
} from '@waypoint/contracts/destinations';
import type { TripStyle } from '@waypoint/contracts/trips';
import { CATEGORY_DEFAULTS, categoryOf } from './classify.ts';
import { parseFee } from './fee.ts';
import { parseOpeningHours } from './openingHours.ts';
import type { ResearchSource } from './sources/http.ts';
import type { OsmFacts } from './sources/overpass.ts';
import type { WikidataCandidate } from './sources/wikidata.ts';

/** Where one fact came from (a row of `spot_sources`). */
export type FactSource = {
  readonly field:
    'identity' | 'photo' | 'hours' | 'fee' | 'address' | 'popularity';
  readonly source: ResearchSource;
  readonly sourceRef: string | null;
  readonly url: string | null;
  readonly license: string | null;
};

/** A spot as research found it, before review. */
export type SpotDraft = {
  readonly wikidataId: string;
  readonly name: string;
  readonly category: SpotCategory;
  readonly styles: readonly TripStyle[];
  readonly lat: number;
  readonly lng: number;
  readonly address: string | null;
  readonly description: string | null;
  readonly website: string | null;
  readonly visitMinutes: number;
  readonly popularity: number;
  readonly photo: Photo | null;
  readonly openingHours: OpeningHours | null;
  readonly fee: Fee;
  readonly sources: readonly FactSource[];
};

const WIKIDATA_LICENSE = 'CC0 1.0';
const OSM_LICENSE = 'ODbL 1.0';

/** Wikidata descriptions are lower case ("fortified tower in Lisbon"). */
const sentence = (text: string | null): string | null =>
  text === null || text === ''
    ? null
    : `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;

const addressOf = (osm: OsmFacts | undefined): string | null =>
  osm?.street === undefined
    ? null
    : [osm.street, osm.houseNumber]
        .filter((part) => part !== undefined)
        .join(' ');

/** The fields a saved spot must pass; a draft that fails one is not saved. */
const draftFieldsSchema = spotSchema.pick({
  name: true,
  category: true,
  styles: true,
  lat: true,
  lng: true,
  address: true,
  description: true,
  website: true,
  visitMinutes: true,
  popularity: true,
  photo: true,
  openingHours: true,
  fee: true,
});
const websiteSchema = spotSchema.shape.website.unwrap();

/** A valid http(s) URL only — some sources store bare domains or mailto links. */
const webUrl = (value: string | null | undefined): string | null =>
  value !== null &&
  value !== undefined &&
  /^https?:\/\//.test(value) &&
  websiteSchema.safeParse(value).success
    ? value
    : null;

/**
 * Combines what each source knows about one place into a draft. Pure.
 * `undefined` when the place isn't a kind of spot we visit, or a fact fails
 * the spot contract (which would otherwise break every read of the city).
 */
export const buildDraft = (
  candidate: WikidataCandidate,
  osm: OsmFacts | undefined,
  photo: Photo | undefined,
  popularity: number,
): SpotDraft | undefined => {
  const category = categoryOf(candidate.classIds);

  if (category === undefined) return undefined;

  const defaults = CATEGORY_DEFAULTS[category];
  const wikidataUrl = `https://www.wikidata.org/wiki/${candidate.wikidataId}`;
  const osmUrl =
    osm === undefined ? null : `https://www.openstreetmap.org/${osm.osmRef}`;
  const fromOsm = (field: FactSource['field']): FactSource => ({
    field,
    source: 'openstreetmap',
    sourceRef: osm?.osmRef ?? null,
    url: osmUrl,
    license: OSM_LICENSE,
  });

  const draft: SpotDraft = {
    wikidataId: candidate.wikidataId,
    name: candidate.name,
    category,
    styles: defaults.styles,
    lat: candidate.lat,
    lng: candidate.lng,
    address: addressOf(osm),
    description: sentence(candidate.description),
    website: webUrl(osm?.website) ?? webUrl(candidate.website),
    visitMinutes: defaults.visitMinutes,
    popularity,
    photo: photo ?? null,
    openingHours: parseOpeningHours(osm?.openingHours),
    fee: parseFee(osm?.fee, osm?.charge),
    sources: [
      {
        field: 'identity',
        source: 'wikidata',
        sourceRef: candidate.wikidataId,
        url: wikidataUrl,
        license: WIKIDATA_LICENSE,
      },
      ...(osm?.openingHours === undefined ? [] : [fromOsm('hours')]),
      ...(osm?.fee === undefined && osm?.charge === undefined
        ? []
        : [fromOsm('fee')]),
      ...(osm?.street === undefined ? [] : [fromOsm('address')]),
      ...(photo === undefined
        ? []
        : [
            {
              field: 'photo' as const,
              source: 'wikimedia-commons' as const,
              sourceRef: null,
              url: photo.sourceUrl,
              license: photo.license,
            },
          ]),
      ...(candidate.enwikiTitle === null
        ? []
        : [
            {
              field: 'popularity' as const,
              source: 'wikipedia' as const,
              sourceRef: candidate.enwikiTitle,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(candidate.enwikiTitle)}`,
              license: null,
            },
          ]),
    ],
  };

  return draftFieldsSchema.safeParse(draft).success ? draft : undefined;
};
