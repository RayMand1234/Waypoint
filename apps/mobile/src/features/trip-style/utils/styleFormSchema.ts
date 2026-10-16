import { tripPaceSchema, tripStyleSchema } from '@waypoint/contracts/trips';
import { z } from 'zod';

export const styleFormSchema = z.object({
  styles: z.array(tripStyleSchema).min(1, 'Pick at least one style.'),
  pace: tripPaceSchema,
});

export type StyleFormValues = z.infer<typeof styleFormSchema>;
