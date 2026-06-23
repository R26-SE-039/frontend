import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
});

export const registerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name is too long'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long'),
});

export const acceptInviteSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long'),
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;
export type AcceptInviteFields = z.infer<typeof acceptInviteSchema>;

/**
 * Helper to validate data against a schema and return a single error string
 */
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } => {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Return the first error message
  const firstError = result.error.issues[0]?.message || 'Validation failed';
  return { success: false, error: firstError };
};
