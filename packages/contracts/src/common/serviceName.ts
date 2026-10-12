import { z } from 'zod'

/** The four Waypoint services (`docs/architecture.md` §2). A closed set, not a free string. */
export const serviceNameSchema = z.enum(['trips', 'search', 'planner', 'jobs'])
export type ServiceName = z.infer<typeof serviceNameSchema>
