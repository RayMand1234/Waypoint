import { z } from 'zod'

/**
 * Branded: these are validated strings, not plain ones. A literal like
 * `'2026-13-01'` or `'09:30'` assigned straight to one of these types is now a
 * compile error — the only way to get one is to parse it.
 */

/** A calendar date with no time or zone: `2026-05-12`. Trip start/end dates. */
export const isoDateSchema = z.iso.date().brand<'IsoDate'>()
export type IsoDate = z.infer<typeof isoDateSchema>

/** An instant with an offset: `2026-05-12T09:30:00.000Z`. Timestamps on the wire. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true }).brand<'IsoDateTime'>()
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>

/** Wall-clock time of day with no date: `09:30`. When a planned stop starts. */
export const isoTimeSchema = z.iso.time({ precision: -1 }).brand<'IsoTime'>()
export type IsoTime = z.infer<typeof isoTimeSchema>
