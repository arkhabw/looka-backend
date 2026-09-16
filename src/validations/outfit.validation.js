import { z } from 'zod';

export const createOutfitSchema = z
  .object({
    name: z.string().max(150, 'Nama outfit maksimal 150 karakter').optional().default('My Outfit'),
    topId: z.number().int().positive().nullable().optional(),
    bottomId: z.number().int().positive().nullable().optional(),
    outerId: z.number().int().positive().nullable().optional(),
    footwearId: z.number().int().positive().nullable().optional(),
    occasion: z.string().max(50).optional().default('Casual'),
    isFavorite: z.boolean().optional().default(false),
  })
  .refine(
    (data) => data.topId || data.bottomId || data.outerId || data.footwearId,
    {
      message: 'Outfit harus memuat minimal salah satu item pakaian (atasan, bawahan, luaran, atau alas kaki).',
      path: ['items'],
    }
  );

export const updateOutfitSchema = z.object({
  name: z.string().min(1, 'Nama outfit tidak boleh kosong').max(150).optional(),
  topId: z.number().int().positive().nullable().optional(),
  bottomId: z.number().int().positive().nullable().optional(),
  outerId: z.number().int().positive().nullable().optional(),
  footwearId: z.number().int().positive().nullable().optional(),
  occasion: z.string().max(50).optional(),
  isFavorite: z.boolean().optional(),
});

export const logWearSchema = z
  .object({
    outfitId: z.number().int().positive().nullable().optional(),
    topId: z.number().int().positive().nullable().optional(),
    bottomId: z.number().int().positive().nullable().optional(),
    outerId: z.number().int().positive().nullable().optional(),
    footwearId: z.number().int().positive().nullable().optional(),
    wornDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .optional(),
    notes: z.string().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .refine(
    (data) => data.outfitId || data.topId || data.bottomId || data.outerId || data.footwearId,
    {
      message: 'Pilih outfitId tersimpan atau tentukan item pakaian langsung untuk dicatat ke kalender.',
      path: ['outfitId'],
    }
  );
