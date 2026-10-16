import { err, ok, type Result } from '@waypoint/contracts/common';
import { photoSchema, type Photo } from '@waypoint/contracts/destinations';
import { z } from 'zod';
import type { TracedFetch } from '../../observability/tracedFetch.ts';
import { fetchJson, type SourceFailure } from './http.ts';

const ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
const TIMEOUT_MS = 30_000;
const THUMB_WIDTH = 1200;
/** The Commons API answers up to 50 titles per request. */
const BATCH = 50;

const metaValue = z.object({ value: z.string() }).optional();
const responseSchema = z.object({
  query: z
    .object({
      normalized: z
        .array(z.object({ from: z.string(), to: z.string() }))
        .default([]),
      pages: z.record(
        z.string(),
        z.object({
          title: z.string(),
          imageinfo: z
            .array(
              z.object({
                thumburl: z.string().optional(),
                url: z.string(),
                descriptionurl: z.string(),
                extmetadata: z
                  .object({
                    Artist: metaValue,
                    LicenseShortName: metaValue,
                    LicenseUrl: metaValue,
                  })
                  .default({}),
              }),
            )
            .optional(),
        }),
      ),
    })
    .optional(),
});

/** Commons puts HTML (links) in the artist field; the credit needs plain text. */
const plainText = (html: string): string =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** A photo with a clear licence, checked against the contract so a bad URL is never saved. */
const toPhoto = (
  info: NonNullable<z.output<typeof responseSchema>['query']>['pages'][string],
): Photo | undefined => {
  const image = info.imageinfo?.[0];
  const license = image?.extmetadata.LicenseShortName?.value;

  if (image === undefined || license === undefined) return undefined;

  const author = image.extmetadata.Artist?.value;
  const photo = photoSchema.safeParse({
    url: image.thumburl ?? image.url,
    author: author === undefined ? null : plainText(author) || null,
    license,
    licenseUrl: image.extmetadata.LicenseUrl?.value ?? null,
    sourceUrl: image.descriptionurl,
  });

  return photo.success ? photo.data : undefined;
};

const fetchBatch = async (
  fetch: TracedFetch,
  files: readonly string[],
): Promise<Result<ReadonlyMap<string, Photo>, SourceFailure>> => {
  const url = new URL(ENDPOINT);

  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
    titles: files.map((file) => `File:${file}`).join('|'),
  }).toString();

  const response = await fetchJson({
    fetch,
    source: 'wikimedia-commons',
    url,
    schema: responseSchema,
    timeoutMs: TIMEOUT_MS,
  });

  if (!response.ok) return err(response.error);

  // No `query` at all: none of the files exist.
  if (response.value.query === undefined) return ok(new Map());

  const { pages, normalized } = response.value.query;
  const byTitle = new Map(
    Object.values(pages).map((page) => [page.title, toPhoto(page)] as const),
  );

  return ok(
    new Map(
      files.flatMap((file) => {
        const asked = `File:${file}`;
        const title = normalized.find((n) => n.from === asked)?.to ?? asked;
        const photo = byTitle.get(title);

        return photo === undefined ? [] : [[file, photo] as const];
      }),
    ),
  );
};

export type PhotosFound = {
  readonly photos: ReadonlyMap<string, Photo>;
  /** One per batch that failed; its files simply have no photo this run. */
  readonly failures: readonly SourceFailure[];
};

/** Photo URL and licence credit for each Commons file, keyed by file name. Files without a clear licence are left out. */
export const fetchPhotos = async (
  fetch: TracedFetch,
  files: readonly string[],
): Promise<PhotosFound> => {
  const batches = Array.from(
    { length: Math.ceil(files.length / BATCH) },
    (_, i) => files.slice(i * BATCH, (i + 1) * BATCH),
  );
  const results = await Promise.all(
    batches.map((batch) => fetchBatch(fetch, batch)),
  );

  return {
    photos: new Map(
      results.flatMap((result) => (result.ok ? [...result.value] : [])),
    ),
    failures: results.flatMap((result) => (result.ok ? [] : [result.error])),
  };
};
