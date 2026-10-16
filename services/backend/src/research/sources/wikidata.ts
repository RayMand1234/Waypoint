import {
  latitudeSchema,
  longitudeSchema,
  ok,
  type Result,
} from '@waypoint/contracts/common';
import { z } from 'zod';
import { groupBy } from '../../lib/groupBy.ts';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import { categoryOf, RESEARCH_CLASSES } from '../classify.ts';
import { fetchJson, type SourceFailure } from './http.ts';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const TIMEOUT_MS = 90_000;
/** Places covered by fewer Wikipedia languages are rarely worth a tourist's day. */
const MIN_SITELINKS = 8;
const MAX_CANDIDATES = 80;

export type WikidataCandidate = {
  readonly wikidataId: string;
  readonly name: string;
  readonly description: string | null;
  readonly lat: number;
  readonly lng: number;
  readonly classIds: readonly string[];
  readonly sitelinks: number;
  /** Commons file name of the main image, e.g. `Torre de Belém.jpg`. */
  readonly imageFile: string | null;
  readonly website: string | null;
  /** English Wikipedia article title, for page views. */
  readonly enwikiTitle: string | null;
};

const binding = z.object({ value: z.string() });
const placesSchema = z.object({
  results: z.object({
    bindings: z.array(
      z.object({
        item: binding,
        name: binding,
        point: binding,
        types: binding,
        sitelinks: z.object({ value: z.coerce.number().int().min(0) }),
        description: binding.optional(),
        image: binding.optional(),
        website: binding.optional(),
        article: binding.optional(),
      }),
    ),
  }),
});
const classesSchema = z.object({
  results: z.object({
    bindings: z.array(z.object({ type: binding, cls: binding })),
  }),
});

type PlaceRow = z.output<typeof placesSchema>['results']['bindings'][number];

/*
 * Two queries, because one is too slow for a big city: walking every place's
 * class tree (`wdt:P31/wdt:P279*`) inside the radius query timed out for
 * London. So the first query lists notable places with their direct types,
 * the second asks once which of those types are kinds of spot we visit.
 * `hint:Query hint:optimizer "None"` keeps the written order: area first,
 * then the sitelink filter, which leaves only a few thousand places.
 */
const placesQuery = (lat: number, lng: number, radiusKm: number): string => `
SELECT ?item (SAMPLE(?label) AS ?name) (SAMPLE(?desc) AS ?description) (SAMPLE(?coord) AS ?point)
       (GROUP_CONCAT(DISTINCT ?type) AS ?types) (MAX(?links) AS ?sitelinks)
       (SAMPLE(?img) AS ?image) (SAMPLE(?site) AS ?website) (SAMPLE(?enwiki) AS ?article)
WHERE {
  hint:Query hint:optimizer "None" .
  SERVICE wikibase:around {
    ?item wdt:P625 ?coord .
    bd:serviceParam wikibase:center "Point(${String(lng)} ${String(lat)})"^^geo:wktLiteral .
    bd:serviceParam wikibase:radius "${String(radiusKm)}" .
  }
  ?item wikibase:sitelinks ?links .
  FILTER(?links >= ${String(MIN_SITELINKS)})
  ?item wdt:P31 ?type .
  FILTER NOT EXISTS { ?item wdt:P576 ?dissolved }
  FILTER NOT EXISTS { ?item wdt:P5816 wd:Q56556915 }
  ?item rdfs:label ?label . FILTER(LANG(?label) = "en")
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }
  OPTIONAL { ?item wdt:P18 ?img }
  OPTIONAL { ?item wdt:P856 ?site }
  OPTIONAL { ?enwiki schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
}
GROUP BY ?item ORDER BY DESC(?sitelinks)`;

/** Which of `typeIds` are (subclasses of) a research class. */
const classesQuery = (typeIds: readonly string[]): string => `
SELECT DISTINCT ?type ?cls WHERE {
  VALUES ?type { ${typeIds.map((id) => `wd:${id}`).join(' ')} }
  VALUES ?cls { ${RESEARCH_CLASSES.map((id) => `wd:${id}`).join(' ')} }
  ?type wdt:P279* ?cls .
}`;

const lastSegment = (uri: string): string =>
  decodeURIComponent(uri.split('/').pop() ?? '');

/** "Point(-9.2160 38.6916)" → [lat, lng]; `undefined` unless both are real coordinates. */
const parsePoint = (wkt: string): readonly [number, number] | undefined => {
  const match = /^Point\(([-\d.]+) ([-\d.]+)\)$/.exec(wkt);
  const lat = latitudeSchema.safeParse(Number(match?.[2]));
  const lng = longitudeSchema.safeParse(Number(match?.[1]));

  return lat.success && lng.success ? [lat.data, lng.data] : undefined;
};

const typeIdsOf = (row: PlaceRow): readonly string[] =>
  row.types.value.split(' ').map(lastSegment);

const sparql = <Schema extends z.ZodType>(
  fetch: TracedFetch,
  query: string,
  schema: Schema,
): Promise<Result<z.output<Schema>, SourceFailure>> =>
  // POST: the classes query lists hundreds of types, too long for a URL.
  fetchJson({
    fetch,
    source: 'wikidata',
    url: new URL(ENDPOINT),
    init: {
      method: 'POST',
      body: new URLSearchParams({ query }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/sparql-results+json',
      },
    },
    schema,
    timeoutMs: TIMEOUT_MS,
  });

/** The research classes each type falls under, keyed by type id. */
const classesByType = (
  rows: z.output<typeof classesSchema>['results']['bindings'],
): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...groupBy(rows, (row) => lastSegment(row.type.value))].map(
      ([type, typeRows]) =>
        [type, typeRows.map((row) => lastSegment(row.cls.value))] as const,
    ),
  );

const toCandidate = (
  row: PlaceRow,
  classes: ReadonlyMap<string, readonly string[]>,
): WikidataCandidate[] => {
  const point = parsePoint(row.point.value);
  const classIds = [
    ...new Set(typeIdsOf(row).flatMap((type) => classes.get(type) ?? [])),
  ];

  // Checked here, not only when drafting, so places we never visit don't use up `MAX_CANDIDATES`.
  if (point === undefined || categoryOf(classIds) === undefined) return [];

  return [
    {
      wikidataId: lastSegment(row.item.value),
      name: row.name.value,
      description: row.description?.value ?? null,
      lat: point[0],
      lng: point[1],
      classIds,
      sitelinks: row.sitelinks.value,
      imageFile: row.image === undefined ? null : lastSegment(row.image.value),
      website: row.website?.value ?? null,
      enwikiTitle:
        row.article === undefined ? null : lastSegment(row.article.value),
    },
  ];
};

/**
 * Notable places of the kinds we visit within `radiusKm` of a city centre,
 * most notable first. Places Wikidata marks as dissolved or destroyed are left out.
 */
export const fetchCandidates = async (
  fetch: TracedFetch,
  center: { readonly lat: number; readonly lng: number },
  radiusKm: number,
): Promise<Result<WikidataCandidate[], SourceFailure>> => {
  const places = await sparql(
    fetch,
    placesQuery(center.lat, center.lng, radiusKm),
    placesSchema,
  );

  if (!places.ok) return places;

  const rows = places.value.results.bindings;
  const typeIds = [...new Set(rows.flatMap(typeIdsOf))];

  if (typeIds.length === 0) return ok([]);

  const classes = await sparql(fetch, classesQuery(typeIds), classesSchema);

  if (!classes.ok) return classes;

  const byType = classesByType(classes.value.results.bindings);

  return ok(
    rows.flatMap((row) => toCandidate(row, byType)).slice(0, MAX_CANDIDATES),
  );
};
