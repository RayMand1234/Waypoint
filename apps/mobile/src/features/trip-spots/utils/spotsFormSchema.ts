import {
  adultsSchema,
  childAgeSchema,
  isoDateSchema,
  MAX_CHILDREN,
  type IsoDate,
} from '@waypoint/contracts/common';
import { z } from 'zod';

/** The longest trip the planner handles. */
export const MAX_TRIP_DAYS = 21;

/**
 * A date the form holds as `IsoDate` both in and out: values only ever come
 * from the calendar, which produces validated dates, and the form keeps them.
 */
const isoDateField = z.custom<IsoDate>(
  (value) => isoDateSchema.safeParse(value).success,
  'Pick a date.',
);

/**
 * At least one spot must be picked — unless the destination has none yet (a
 * city found by search), when the trip goes on with dates and travelers only.
 */
const valuesSchema = (spotsOffered: number) =>
  z.object({
    startDate: isoDateField,
    endDate: isoDateField,
    adults: adultsSchema,
    childrenAges: z.array(childAgeSchema).max(MAX_CHILDREN),
    spotIds: z
      .array(z.string())
      .min(spotsOffered > 0 ? 1 : 0, 'Pick at least one spot.'),
  });

export type SpotsFormValues = z.infer<ReturnType<typeof valuesSchema>>;

export const spotsFormSchema = (
  spotsOffered: number,
): z.ZodType<SpotsFormValues, SpotsFormValues> =>
  valuesSchema(spotsOffered).refine(
    (values) => values.endDate >= values.startDate,
    { message: 'The trip ends before it starts.', path: ['endDate'] },
  );
