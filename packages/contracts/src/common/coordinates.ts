import { z } from 'zod';

/** Degrees north/south of the equator. */
export const latitudeSchema = z.number().min(-90).max(90);

/** Degrees east/west of Greenwich. */
export const longitudeSchema = z.number().min(-180).max(180);
