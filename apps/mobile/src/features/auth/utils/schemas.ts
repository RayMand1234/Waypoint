import { z } from 'zod';

export const emailFormSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter an email like you@example.com.')),
});
export type EmailFormValues = z.input<typeof emailFormSchema>;

export const codeFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code from the email.'),
});
export type CodeFormValues = z.input<typeof codeFormSchema>;
