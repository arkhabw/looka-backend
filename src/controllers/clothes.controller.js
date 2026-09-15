import { eq, and, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { clothes } from '../db/schema.js';
import { successResponse, errorResponse } from '../utils/response.js';

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

    // 2. Relative image path stored in DB
    const imageUrl = req.file.filename;

    // 3. Insert into database
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
 * Controller: Get all clothes for current user
 * GET /api/clothes
 */
export const getClothes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    // Query builder
    let queryConditions = eq(clothes.userId, userId);

    if (category && category !== 'All') {
      queryConditions = and(queryConditions, eq(clothes.category, category));
    }

    const items = await db
      .select()
      .from(clothes)
      .where(queryConditions)
      .orderBy(desc(clothes.createdAt));

    return successResponse(res, {
      statusCode: 200,
      message: 'Katalog pakaian berhasil dimuat.',
      data: items,
      meta: {
        total: items.length,
        categoryFilter: category || 'All',
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