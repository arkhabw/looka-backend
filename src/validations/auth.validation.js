import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email wajib diisi' })
    .email('Format email tidak valid')
    .max(255, 'Email maksimal 255 karakter'),
  username: z
    .string({ required_error: 'Username wajib diisi' })
    .min(3, 'Username minimal 3 karakter')
    .max(100, 'Username maksimal 100 karakter'),
  password: z
    .string({ required_error: 'Password wajib diisi' })
    .min(6, 'Password minimal 6 karakter'),
  stylePreference: z.string().optional().default('Casual'),
  city: z.string().optional().default('Jakarta'),
});

export const loginSchema = z
  .object({
    email: z.string().optional(),
    username: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string({ required_error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
  })
  .refine((data) => Boolean((data.email && data.email.trim()) || (data.username && data.username.trim()) || (data.identifier && data.identifier.trim())), {
    message: 'Email atau username wajib diisi',
    path: ['email'],
  });


export const updateProfileSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(100).optional(),
  stylePreference: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
});