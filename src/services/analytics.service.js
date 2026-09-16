import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { clothes, outfits, outfitLogs } from '../db/schema.js';

/**
 * Service to aggregate and calculate comprehensive wardrobe analytics
 */
export const getWardrobeAnalytics = async (userId) => {
  // 1. Fetch user's entire clothes, outfits, and calendar wear logs
  const userClothes = await db.select().from(clothes).where(eq(clothes.userId, userId));
  const userOutfits = await db.select().from(outfits).where(eq(outfits.userId, userId));
  const userLogs = await db.query.outfitLogs.findMany({
    where: eq(outfitLogs.userId, userId),
    with: { outfit: true },
  });

  const totalClothes = userClothes.length;
  const totalOutfits = userOutfits.length;
  const totalWornLogs = userLogs.length;

  // 2. Calculate utilization rate (items with lastWornAt != null)
  const wornClothes = userClothes.filter((c) => c.lastWornAt !== null);
  const wornClothesCount = wornClothes.length;
  const unwornClothesCount = totalClothes - wornClothesCount;
  const utilizationRate = totalClothes > 0 ? Math.round((wornClothesCount / totalClothes) * 100) : 0;

  // 3. Category distribution
  const categoryCounts = {};
  for (const c of userClothes) {
    const cat = c.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
    percentage: totalClothes > 0 ? Math.round((count / totalClothes) * 100) : 0,
  }));

  // 4. Color palette distribution
  const colorCounts = {};
  for (const c of userClothes) {
    const color = (c.color || 'Unknown').trim();
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }
  const colorBreakdown = Object.entries(colorCounts)
    .map(([color, count]) => ({
      color,
      count,
      percentage: totalClothes > 0 ? Math.round((count / totalClothes) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 5. Wear frequency analysis (mapping clothing IDs to log occurrences)
  const wearFrequencyMap = {};
  for (const log of userLogs) {
    if (log.outfit) {
      const items = [
        log.outfit.topId,
        log.outfit.bottomId,
        log.outfit.outerId,
        log.outfit.footwearId,
      ].filter(Boolean);

      for (const id of items) {
        wearFrequencyMap[id] = (wearFrequencyMap[id] || 0) + 1;
      }
    }
  }

  const clothesWithWear = userClothes.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    imageUrl: item.imageUrl,
    lastWornAt: item.lastWornAt,
    wearCount: wearFrequencyMap[item.id] || 0,
  }));

  // Most worn items (top 5 with wearCount > 0)
  const mostWornItems = clothesWithWear
    .filter((c) => c.wearCount > 0)
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 5);

  // Neglected items (never worn or wearCount == 0, sorted by lastWornAt ascending)
  const neglectedItems = clothesWithWear
    .filter((c) => c.wearCount === 0 || c.lastWornAt === null)
    .slice(0, 5);

  // 6. Sustainability advice
  let advice = '';
  if (totalClothes === 0) {
    advice = 'Lemari pakaian Anda masih kosong. Mulailah menambahkan pakaian untuk melihat wawasan gaya dan analitik utilisasi.';
  } else if (utilizationRate >= 75) {
    advice = `Luar biasa! Tingkat utilisasi lemari Anda mencapai ${utilizationRate}%. Anda memanfaatkan sebagian besar koleksi pakaian secara aktif dan berkelanjutan.`;
  } else if (utilizationRate >= 40) {
    advice = `Tingkat pemanfaatan lemari Anda sebesar ${utilizationRate}%. Coba kenakan pakaian yang belum pernah dipakai minggu ini untuk merotasi gaya Anda.`;
  } else {
    advice = `Tingkat pemanfaatan lemari Anda baru ${utilizationRate}%. Terdapat ${unwornClothesCount} pakaian yang belum pernah dipakai. Manfaatkan fitur rekomendasi harian untuk mengeksplorasi koleksi tersebut!`;
  }

  return {
    overview: {
      totalClothes,
      totalOutfits,
      totalWornLogs,
      wornClothesCount,
      unwornClothesCount,
      utilizationRate,
    },
    categoryBreakdown,
    colorBreakdown,
    mostWornItems,
    neglectedItems,
    sustainabilityInsight: advice,
  };
};
