import { z } from 'zod'

/** A calendar date with no time or zone: `2026-05-12`. Trip start/end dates. */
export const isoDateSchema = z.iso.date()
export type IsoDate = z.infer<typeof isoDateSchema>

/** An instant with an offset: `2026-05-12T09:30:00.000Z`. Timestamps on the wire. */
export const isoDateTimeSchema = z.iso.datetime({ offset: true })
export type IsoDateTime = z.infer<typeof isoDateTimeSchema>

/** Wall-clock time of day with no date: `09:30`. When a planned stop starts. */
export const isoTimeSchema = z.iso.time({ precision: -1 })
export type IsoTime = z.infer<typeof isoTimeSchema>
