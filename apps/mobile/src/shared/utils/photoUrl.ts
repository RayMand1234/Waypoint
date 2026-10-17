import type { Photo } from '@waypoint/contracts/destinations';

/** The thumbnail widths Wikimedia serves; it refuses any other width. */
export type PhotoWidth = 250 | 500 | 960 | 1280;

/**
 * The photo at a display size: a Wikimedia thumbnail wider than `width` is
 * asked for at `width` instead (a fraction of the download); any other URL is
 * used as it is.
 */
export const photoAtWidth = (url: string, width: PhotoWidth): string =>
  url.replace(/\/(\d+)px-/, (match, current: string) =>
    Number(current) > width ? `/${String(width)}px-` : match,
  );

/** "Photo: Rehman Abubakr · CC BY-SA 4.0" — the credit the photo's licence requires. */
export const photoCredit = (photo: Pick<Photo, 'author' | 'license'>): string =>
  `Photo: ${[photo.author, photo.license]
    .filter((part) => part !== null && part.trim() !== '')
    .join(' · ')}`;
