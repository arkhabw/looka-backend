import { eq, and, desc, ilike, inArray, like } from 'drizzle-orm';
import { db } from '../config/db.js';
import { clothes, outfits, outfitLogs } from '../db/schema.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Helper to verify that clothing items exist and belong to the user
 */
const verifyUserClothes = async (userId, itemIds) => {
  const validIds = itemIds.filter(Boolean);
  if (validIds.length === 0) return true;

  const foundItems = await db
    .select({ id: clothes.id })
    .from(clothes)
    .where(and(eq(clothes.userId, userId), inArray(clothes.id, validIds)));

  return foundItems.length === validIds.length;
};

/**
 * Helper to get current date formatted as YYYY-MM-DD
 */
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 1. Create a new outfit / Lookbook item
 * POST /api/outfits
 */
export const createOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, topId, bottomId, outerId, footwearId, occasion, isFavorite } = req.body;

    // Verify all item IDs belong to this user
    const itemsValid = await verifyUserClothes(userId, [topId, bottomId, outerId, footwearId]);
    if (!itemsValid) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Salah satu item pakaian tidak valid atau bukan milik lemari Anda.',
      });
    }

    const [newOutfit] = await db
      .insert(outfits)
      .values({
        userId,
        name: name || 'My Outfit',
        topId: topId || null,
        bottomId: bottomId || null,
        outerId: outerId || null,
        footwearId: footwearId || null,
        occasion: occasion || 'Casual',
        isFavorite: Boolean(isFavorite),
      })
      .returning();

    // Fetch created outfit with populated clothing relations
    const populatedOutfit = await db.query.outfits.findFirst({
      where: eq(outfits.id, newOutfit.id),
      with: {
        top: true,
        bottom: true,
        outer: true,
        footwear: true,
      },
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Outfit berhasil disimpan ke Lookbook.',
      data: populatedOutfit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get user's saved outfits
 * GET /api/outfits
 */
export const getOutfits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isFavorite, search, occasion } = req.query;

    const conditions = [eq(outfits.userId, userId)];

    if (isFavorite === 'true') {
      conditions.push(eq(outfits.isFavorite, true));
    }
    if (occasion) {
      conditions.push(eq(outfits.occasion, occasion));
    }
    if (search && search.trim()) {
      conditions.push(ilike(outfits.name, `%${search.trim()}%`));
    }

    const userOutfits = await db.query.outfits.findMany({
      where: and(...conditions),
      with: {
        top: true,
        bottom: true,
        outer: true,
        footwear: true,
      },
      orderBy: [desc(outfits.createdAt)],
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Daftar outfit berhasil diambil.',
      data: userOutfits,
      meta: {
        total: userOutfits.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get single outfit details
 * GET /api/outfits/:id
 */
export const getOutfitById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const outfitId = Number(req.params.id);

    if (isNaN(outfitId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID outfit tidak valid.',
      });
    }

    const outfit = await db.query.outfits.findFirst({
      where: and(eq(outfits.id, outfitId), eq(outfits.userId, userId)),
      with: {
        top: true,
        bottom: true,
        outer: true,
        footwear: true,
      },
    });

    if (!outfit) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Outfit tidak ditemukan dalam koleksi Anda.',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Detail outfit berhasil diambil.',
      data: outfit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Update outfit metadata or items
 * PUT /api/outfits/:id
 */
export const updateOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const outfitId = Number(req.params.id);

    if (isNaN(outfitId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID outfit tidak valid.',
      });
    }

    // Check existing outfit
    const existing = await db
      .select({ id: outfits.id })
      .from(outfits)
      .where(and(eq(outfits.id, outfitId), eq(outfits.userId, userId)));

    if (existing.length === 0) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Outfit tidak ditemukan atau bukan milik Anda.',
      });
    }

    const { name, topId, bottomId, outerId, footwearId, occasion, isFavorite } = req.body;

    // Verify item IDs if updated
    const itemsToVerify = [topId, bottomId, outerId, footwearId].filter((id) => id !== undefined);
    if (itemsToVerify.length > 0) {
      const itemsValid = await verifyUserClothes(userId, itemsToVerify);
      if (!itemsValid) {
        return errorResponse(res, {
          statusCode: 400,
          message: 'Salah satu item pakaian yang dipilih tidak valid atau bukan milik Anda.',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (topId !== undefined) updateData.topId = topId;
    if (bottomId !== undefined) updateData.bottomId = bottomId;
    if (outerId !== undefined) updateData.outerId = outerId;
    if (footwearId !== undefined) updateData.footwearId = footwearId;
    if (occasion !== undefined) updateData.occasion = occasion;
    if (isFavorite !== undefined) updateData.isFavorite = Boolean(isFavorite);

    await db.update(outfits).set(updateData).where(eq(outfits.id, outfitId));

    const updatedOutfit = await db.query.outfits.findFirst({
      where: eq(outfits.id, outfitId),
      with: {
        top: true,
        bottom: true,
        outer: true,
        footwear: true,
      },
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Outfit berhasil diperbarui.',
      data: updatedOutfit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Delete an outfit
 * DELETE /api/outfits/:id
 */
export const deleteOutfit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const outfitId = Number(req.params.id);

    if (isNaN(outfitId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID outfit tidak valid.',
      });
    }

    const [deleted] = await db
      .delete(outfits)
      .where(and(eq(outfits.id, outfitId), eq(outfits.userId, userId)))
      .returning({ id: outfits.id, name: outfits.name });

    if (!deleted) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Outfit tidak ditemukan atau sudah dihapus.',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: `Outfit "${deleted.name}" berhasil dihapus dari Lookbook.`,
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Log Outfit Wear (Wear Today / OOTD)
 * POST /api/outfits/wear-today
 * Automatically updates lastWornAt for all clothing items used!
 */
export const logOutfitWear = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { outfitId, topId, bottomId, outerId, footwearId, wornDate, notes } = req.body;

    const targetDate = wornDate || getTodayDateString();
    let effectiveOutfitId = outfitId ? Number(outfitId) : null;
    let itemsToUpdate = [];

    // Case A: Wear an existing saved outfit
    if (effectiveOutfitId) {
      const targetOutfit = await db.query.outfits.findFirst({
        where: and(eq(outfits.id, effectiveOutfitId), eq(outfits.userId, userId)),
      });

      if (!targetOutfit) {
        return errorResponse(res, {
          statusCode: 404,
          message: 'Outfit yang dipilih tidak ditemukan dalam koleksi Anda.',
        });
      }

      itemsToUpdate = [
        targetOutfit.topId,
        targetOutfit.bottomId,
        targetOutfit.outerId,
        targetOutfit.footwearId,
      ].filter(Boolean);
    } else {
      // Case B: Log custom combination directly from wardrobe
      const directItems = [topId, bottomId, outerId, footwearId].filter(Boolean);
      const itemsValid = await verifyUserClothes(userId, directItems);
      if (!itemsValid) {
        return errorResponse(res, {
          statusCode: 400,
          message: 'Item pakaian tidak valid atau bukan milik lemari Anda.',
        });
      }

      // Create an automatic outfit entry to link with this log
      const [autoOutfit] = await db
        .insert(outfits)
        .values({
          userId,
          name: `OOTD ${targetDate}`,
          topId: topId || null,
          bottomId: bottomId || null,
          outerId: outerId || null,
          footwearId: footwearId || null,
          occasion: 'Daily Wear',
          isFavorite: false,
        })
        .returning();

      effectiveOutfitId = autoOutfit.id;
      itemsToUpdate = directItems;
    }

    // 1. Insert into outfitLogs
    const [newLog] = await db
      .insert(outfitLogs)
      .values({
        userId,
        outfitId: effectiveOutfitId,
        wornDate: targetDate,
        notes: notes || null,
      })
      .returning();

    // 2. CRITICAL AUTOMATION: Update lastWornAt timestamp on all involved clothes
    if (itemsToUpdate.length > 0) {
      await db
        .update(clothes)
        .set({
          lastWornAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(clothes.userId, userId), inArray(clothes.id, itemsToUpdate)));
    }

    // 3. Fetch populated log with outfit and clothes
    const populatedLog = await db.query.outfitLogs.findFirst({
      where: eq(outfitLogs.id, newLog.id),
      with: {
        outfit: {
          with: {
            top: true,
            bottom: true,
            outer: true,
            footwear: true,
          },
        },
      },
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Pemakaian outfit berhasil dicatat ke kalender dan status lemari diperbarui.',
      data: {
        log: populatedLog,
        updatedItemsCount: itemsToUpdate.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Get OOTD Calendar / Wear History
 * GET /api/outfits/calendar
 */
export const getWearCalendar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { month } = req.query; // e.g. "2026-09"

    const conditions = [eq(outfitLogs.userId, userId)];

    if (month && month.trim()) {
      conditions.push(like(outfitLogs.wornDate, `${month.trim()}%`));
    }

    const history = await db.query.outfitLogs.findMany({
      where: and(...conditions),
      with: {
        outfit: {
          with: {
            top: true,
            bottom: true,
            outer: true,
            footwear: true,
          },
        },
      },
      orderBy: [desc(outfitLogs.wornDate), desc(outfitLogs.createdAt)],
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Riwayat kalender OOTD berhasil diambil.',
      data: history,
      meta: {
        total: history.length,
        filterMonth: month || 'all',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Delete a wear log entry
 * DELETE /api/outfits/calendar/:logId
 */
export const deleteWearLog = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const logId = Number(req.params.logId);

    if (isNaN(logId)) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'ID catatan kalender tidak valid.',
      });
    }

    const [deleted] = await db
      .delete(outfitLogs)
      .where(and(eq(outfitLogs.id, logId), eq(outfitLogs.userId, userId)))
      .returning();

    if (!deleted) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Catatan kalender tidak ditemukan atau sudah dihapus.',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Catatan pemakaian berhasil dihapus dari kalender.',
      data: deleted,
    });
  } catch (error) {
    next(error);
  }
};
