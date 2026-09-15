import fs from 'fs';
import path from 'path';
import { eq, and, desc, asc, ilike } from 'drizzle-orm';
import { db } from '../config/db.js';
import { clothes } from '../db/schema.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { CATEGORIES } from '../validations/clothes.validation.js';

/**
 * Controller: Create new clothing item with image upload
 * POST /api/clothes
 */
export const createClothing = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Verify that image file was uploaded
    if (!req.file) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Foto pakaian wajib diunggah pada field "image".',
      });
    }

    const { name, category, color, style, occasion, weather } = req.body;
    const imageUrl = req.file.filename;

    // 2. Insert into database
    const [newClothing] = await db
      .insert(clothes)
      .values({
        userId,
        name: name.trim(),
        category,
        color: color.trim(),
        style: style || 'Casual',
        occasion: occasion || 'Casual Hangout',
        weather: weather || 'All Weather',
        imageUrl,
      })
      .returning();

    return successResponse(res, {
      statusCode: 201,
      message: 'Pakaian berhasil ditambahkan ke lemari digital Anda.',
      data: newClothing,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get all clothes for current user (with search, multi-filter, and sorting)
 * GET /api/clothes
 */
export const getClothes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, color, style, occasion, search, sortBy } = req.query;

    // Base condition: only current user's clothes
    const conditions = [eq(clothes.userId, userId)];

    // Dynamic filters
    if (category && category !== 'All') {
      conditions.push(eq(clothes.category, category));
    }
    if (color && color !== 'All') {
      conditions.push(ilike(clothes.color, `%${color.trim()}%`));
    }
    if (style && style !== 'All') {
      conditions.push(eq(clothes.style, style));
    }
    if (occasion && occasion !== 'All') {
      conditions.push(eq(clothes.occasion, occasion));
    }
    if (search && search.trim() !== '') {
      conditions.push(ilike(clothes.name, `%${search.trim()}%`));
    }

    // Dynamic sorting
    let orderByClause = desc(clothes.createdAt); // Default: newest first
    if (sortBy === 'oldest') {
      orderByClause = asc(clothes.createdAt);
    } else if (sortBy === 'name_asc') {
      orderByClause = asc(clothes.name);
    } else if (sortBy === 'name_desc') {
      orderByClause = desc(clothes.name);
    } else if (sortBy === 'last_worn') {
      orderByClause = desc(clothes.lastWornAt);
    }

    const items = await db
      .select()
      .from(clothes)
      .where(and(...conditions))
      .orderBy(orderByClause);

    return successResponse(res, {
      statusCode: 200,
      message: 'Katalog pakaian berhasil dimuat.',
      data: items,
      meta: {
        total: items.length,
        filters: {
          category: category || 'All',
          color: color || 'All',
          style: style || 'All',
          occasion: occasion || 'All',
          search: search || '',
          sortBy: sortBy || 'newest',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get single clothing item details
 * GET /api/clothes/:id
 */
export const getClothingById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const clothingId = parseInt(req.params.id, 10);

    if (isNaN(clothingId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID pakaian tidak valid.',
      });
    }

    const [item] = await db
      .select()
      .from(clothes)
      .where(and(eq(clothes.id, clothingId), eq(clothes.userId, userId)))
      .limit(1);

    if (!item) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Pakaian tidak ditemukan dalam lemari Anda.',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Detail pakaian berhasil dimuat.',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update clothing item details & optional image replacement
 * PUT /api/clothes/:id
 */
export const updateClothing = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const clothingId = parseInt(req.params.id, 10);

    if (isNaN(clothingId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID pakaian tidak valid.',
      });
    }

    // 1. Verify item exists and belongs to user
    const [existingItem] = await db
      .select()
      .from(clothes)
      .where(and(eq(clothes.id, clothingId), eq(clothes.userId, userId)))
      .limit(1);

    if (!existingItem) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Pakaian tidak ditemukan dalam lemari Anda.',
      });
    }

    const { name, category, color, style, occasion, weather } = req.body;
    const updateData = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name.trim();
    if (category) updateData.category = category;
    if (color) updateData.color = color.trim();
    if (style) updateData.style = style;
    if (occasion) updateData.occasion = occasion;
    if (weather) updateData.weather = weather;

    // 2. Handle optional image replacement
    if (req.file) {
      const oldImageFilename = existingItem.imageUrl;
      updateData.imageUrl = req.file.filename;

      // Delete old physical image file
      if (oldImageFilename) {
        const oldFilePath = path.resolve('uploads', oldImageFilename);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (unlinkErr) {
            console.warn('[UPLOAD] Gagal menghapus file lama:', unlinkErr.message);
          }
        }
      }
    }

    // 3. Update in database
    const [updatedItem] = await db
      .update(clothes)
      .set(updateData)
      .where(and(eq(clothes.id, clothingId), eq(clothes.userId, userId)))
      .returning();

    return successResponse(res, {
      statusCode: 200,
      message: 'Data pakaian berhasil diperbarui.',
      data: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Delete clothing item & physical image file
 * DELETE /api/clothes/:id
 */
export const deleteClothing = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const clothingId = parseInt(req.params.id, 10);

    if (isNaN(clothingId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID pakaian tidak valid.',
      });
    }

    // 1. Verify item exists and belongs to user
    const [existingItem] = await db
      .select()
      .from(clothes)
      .where(and(eq(clothes.id, clothingId), eq(clothes.userId, userId)))
      .limit(1);

    if (!existingItem) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Pakaian tidak ditemukan dalam lemari Anda.',
      });
    }

    // 2. Delete physical image file
    if (existingItem.imageUrl) {
      const filePath = path.resolve('uploads', existingItem.imageUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('[UPLOAD] Gagal menghapus file gambar:', unlinkErr.message);
        }
      }
    }

    // 3. Delete from database
    await db
      .delete(clothes)
      .where(and(eq(clothes.id, clothingId), eq(clothes.userId, userId)));

    return successResponse(res, {
      statusCode: 200,
      message: 'Pakaian berhasil dihapus dari lemari digital Anda.',
      data: {
        id: clothingId,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get dynamic filter metadata for frontend dropdowns
 * GET /api/clothes/meta/filters
 */
export const getFilterMetadata = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's distinct colors, styles, occasions
    const userClothes = await db
      .select({
        color: clothes.color,
        style: clothes.style,
        occasion: clothes.occasion,
      })
      .from(clothes)
      .where(eq(clothes.userId, userId));

    const distinctColors = [...new Set(userClothes.map((c) => c.color).filter(Boolean))];
    const distinctStyles = [...new Set(userClothes.map((c) => c.style).filter(Boolean))];
    const distinctOccasions = [...new Set(userClothes.map((c) => c.occasion).filter(Boolean))];

    return successResponse(res, {
      statusCode: 200,
      message: 'Metadata filter berhasil dimuat.',
      data: {
        categories: CATEGORIES,
        colors: distinctColors,
        styles: distinctStyles,
        occasions: distinctOccasions,
      },
    });
  } catch (error) {
    next(error);
  }
};