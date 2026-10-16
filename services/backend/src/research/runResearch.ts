import { ok, type Result } from '@waypoint/contracts/common';
import { mapLimit } from '../lib/mapLimit.ts';
import type { Logger } from '../observability/logger.ts';
import type { TracedFetch } from '../observability/tracedFetch.ts';
import type { SpotResearchRepository } from '../repositories/spotResearch.repository.ts';
import type { CityDefinition } from './cities.ts';
import { buildDraft, type SpotDraft } from './draft.ts';
import { popularityScores } from './popularity.ts';
import { fetchPhotos } from './sources/commons.ts';
import type { SourceFailure } from './sources/http.ts';
import { fetchOsmFacts } from './sources/overpass.ts';
import { fetchPageViews } from './sources/wikipedia.ts';
import { fetchCandidates, type WikidataCandidate } from './sources/wikidata.ts';

/** Page-view requests in flight at once — Wikimedia asks for restraint. */
const PAGE_VIEW_CONCURRENCY = 4;

export type ResearchSummary = {
  readonly candidates: number;
  readonly saved: number;
  readonly created: number;
  readonly withPhoto: number;
  readonly withHours: number;
  readonly withReadableHours: number;
  readonly withFee: number;
  readonly withPrice: number;
};

const summarise = (
  drafts: readonly SpotDraft[],
  candidates: number,
  created: number,
): ResearchSummary => ({
  candidates,
  saved: drafts.length,
  created,
  withPhoto: drafts.filter((d) => d.photo !== null).length,
  withHours: drafts.filter((d) => d.openingHours !== null).length,
  withReadableHours: drafts.filter((d) => d.openingHours?.weekly != null)
    .length,
  withFee: drafts.filter((d) => d.fee.kind !== 'unknown').length,
  withPrice: drafts.filter((d) => d.fee.kind === 'paid' && d.fee.price !== null)
    .length,
});

/** Page views per candidate (`null` where the request failed), and those failures. */
const pageViewsOf = async (
  fetch: TracedFetch,
  candidates: readonly WikidataCandidate[],
  at: Date,
): Promise<{
  readonly views: readonly (number | null)[];
  readonly failures: readonly SourceFailure[];
}> => {
  const results = await mapLimit(candidates, PAGE_VIEW_CONCURRENCY, (c) =>
    c.enwikiTitle === null
      ? Promise.resolve(ok(0))
      : fetchPageViews(fetch, c.enwikiTitle, at),
  );

  return {
    views: results.map((result) => (result.ok ? result.value : null)),
    failures: results.flatMap((result) => (result.ok ? [] : [result.error])),
  };
};

/** Logs how many requests to a bonus source failed this run; the spots are drafted anyway. */
const warnFailures = (
  logger: Logger,
  what: string,
  failures: readonly SourceFailure[],
): void => {
  if (failures.length > 0)
    logger.warn(`research: ${what} failed for some places`, {
      failed: failures.length,
      first: failures[0],
    });
};

/**
 * Researches one city: candidates from Wikidata, then hours and fees from
 * OpenStreetMap, photos and their licences from Commons, and popularity from
 * Wikipedia page views. Saves everything as drafts for review. Fails only
 * when Wikidata does; the other sources are a bonus, and their failures are
 * logged and leave those facts unknown.
 */
export const runResearch = async ({
  city,
  fetch,
  repository,
  logger,
  now,
}: {
  readonly city: CityDefinition;
  readonly fetch: TracedFetch;
  readonly repository: SpotResearchRepository;
  readonly logger: Logger;
  readonly now: () => Date;
}): Promise<Result<ResearchSummary, SourceFailure>> => {
  const center = { lat: city.lat, lng: city.lng };
  const found = await fetchCandidates(fetch, center, city.radiusKm);

  if (!found.ok) return found;

  const candidates = found.value;

  logger.info('research: candidates', {
    city: city.id,
    count: candidates.length,
  });

  const osm = await fetchOsmFacts(
    fetch,
    center,
    candidates.map((c) => c.wikidataId),
  );

  warnFailures(
    logger,
    'OpenStreetMap hours and fees',
    osm.ok ? [] : [osm.error],
  );

  const photos = await fetchPhotos(
    fetch,
    candidates.flatMap((c) => (c.imageFile === null ? [] : [c.imageFile])),
  );

  warnFailures(logger, 'Commons photos', photos.failures);

  const at = now();
  const pageViews = await pageViewsOf(fetch, candidates, at);

  warnFailures(logger, 'Wikipedia page views', pageViews.failures);

  const popularity = popularityScores(
    candidates.map((c, i) => ({
      views: pageViews.views[i] ?? null,
      sitelinks: c.sitelinks,
    })),
  );
  const drafts = candidates.flatMap((candidate, i) => {
    const draft = buildDraft(
      candidate,
      osm.ok ? osm.value.get(candidate.wikidataId) : undefined,
      candidate.imageFile === null
        ? undefined
        : photos.photos.get(candidate.imageFile),
      popularity[i] ?? 0,
    );

    return draft === undefined ? [] : [draft];
  });

  await repository.saveDestination(
    city,
    drafts.find((draft) => draft.photo !== null)?.photo ?? null,
  );

  const outcomes = await mapLimit(drafts, 1, (draft) =>
    repository.saveSpot(city.id, draft, at),
  );

  return ok(
    summarise(
      drafts,
      candidates.length,
      outcomes.filter((outcome) => outcome === 'created').length,
    ),
  );
};
