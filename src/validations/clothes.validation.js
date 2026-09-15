import { z } from 'zod';

export const CATEGORIES = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'];

export const createClothingSchema = z.object({
  name: z
    .string({ required_error: 'Nama pakaian wajib diisi' })
    .min(2, 'Nama pakaian minimal 2 karakter')
    .max(150, 'Nama pakaian maksimal 150 karakter'),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({
      message: `Kategori tidak valid. Pilihan kategori: ${CATEGORIES.join(', ')}`,
    }),
  }),
  color: z
    .string({ required_error: 'Warna pakaian wajib diisi' })
    .min(1, 'Warna pakaian wajib diisi')
    .max(50, 'Warna maksimal 50 karakter'),
  style: z.string().max(50).optional().default('Casual'),
  occasion: z.string().max(50).optional().default('Casual Hangout'),
  weather: z.string().max(50).optional().default('All Weather'),
});