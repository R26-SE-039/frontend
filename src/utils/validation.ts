import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
});

export const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(120, 'Full name is too long'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long'),
  agileRole: z.string().min(1, 'Please select an agile role')
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;

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
