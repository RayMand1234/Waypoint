import { iataCodeSchema } from '@waypoint/contracts/common';
import { z } from 'zod';

/** The destination as the form holds it: enough to save it and show it. */
export const chosenDestinationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Empty for a destination found by search on an earlier visit (the trip keeps only its name). */
  countryName: z.string(),
});
export type ChosenDestination = z.infer<typeof chosenDestinationSchema>;

/** The parts of a destination the form keeps. */
export const toChosen = ({
  id,
  name,
  countryName,
}: Pick<
  ChosenDestination,
  'id' | 'name' | 'countryName'
>): ChosenDestination => ({
  id,
  name,
  countryName,
});

export const destinationFormSchema = z.object({
  destination: chosenDestinationSchema
    .nullable()
    .refine((value) => value !== null, 'Pick a destination.'),
  originAirport: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(iataCodeSchema.or(z.literal('').transform(() => null)))
    .refine((value) => value !== null, 'Choose where you fly from.'),
});

export type DestinationFormValues = z.input<typeof destinationFormSchema>;
export type DestinationFormOutput = z.output<typeof destinationFormSchema>;
