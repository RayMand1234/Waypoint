import { codeFormSchema, emailFormSchema } from './schemas';

describe('sign-in forms', () => {
  it('normalises the email', () => {
    expect(emailFormSchema.parse({ email: '  Ray@Example.com ' })).toEqual({
      email: 'ray@example.com',
    });
    expect(emailFormSchema.safeParse({ email: 'ray@' }).success).toBe(false);
  });

  it('needs exactly six digits', () => {
    expect(codeFormSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(codeFormSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(codeFormSchema.safeParse({ code: '12345a' }).success).toBe(false);
  });
});
