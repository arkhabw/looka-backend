import { z } from 'zod';

export const recommendationSchema = z.object({
  occasion: z.string().max(100).optional().default('Casual Hangout'),
  city: z.string().max(100).optional(),
  lockedItemId: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+$/).transform(Number),
    ])
    .optional(),
});
