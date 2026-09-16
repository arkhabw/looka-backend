import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { clothes } from '../db/schema.js';
import { calculateOutfitHarmony } from './colorHarmony.service.js';

/**
 * Calculate weather compatibility score for an outfit (0 - 100)
 */
const calculateWeatherScore = (top, bottom, outer, weather) => {
  let score = 80;

  if (weather.isCold) {
    if (outer) score += 15;
    if (top.weather === 'Cold' || bottom?.weather === 'Cold') score += 10;
    if (top.weather === 'Hot') score -= 20;
    if (!outer && top.weather !== 'Cold') score -= 10;
  } else if (weather.isRain) {
    if (outer) score += 15;
    if (top.weather === 'Rainy' || bottom?.weather === 'Rainy') score += 10;
  } else if (weather.isHot) {
    if (outer) score -= 25;
    if (top.weather === 'Hot' || bottom?.weather === 'Hot') score += 10;
    if (top.weather === 'Cold' || outer?.weather === 'Cold') score -= 15;
  } else {
    // Mild / moderate tropical weather
    if (top.weather === 'All Weather') score += 5;
    if (bottom?.weather === 'All Weather') score += 5;
  }

  return Math.min(100, Math.max(30, score));
};

/**
 * Calculate occasion & style compatibility score for an outfit (0 - 100)
 */
const calculateOccasionScore = (top, bottom, outer, occasion = 'Casual Hangout', stylePreference = 'Casual') => {
  let score = 75;
  const targetOccasion = occasion.toLowerCase();
  const targetStyle = stylePreference.toLowerCase();

  // Occasion matching
  if (top.occasion?.toLowerCase() === targetOccasion) score += 10;
  if (bottom?.occasion?.toLowerCase() === targetOccasion) score += 10;

  // Style cohesion
  if (top.style && bottom?.style && top.style.toLowerCase() === bottom.style.toLowerCase()) {
    score += 10;
  }

  // User preference matching
  if (top.style?.toLowerCase() === targetStyle || bottom?.style?.toLowerCase() === targetStyle) {
    score += 5;
  }

  return Math.min(100, Math.max(40, score));
};

/**
 * Calculate wardrobe rotation score (encourages wearing items that haven't been worn recently)
 */
const calculateRotationScore = (top, bottom) => {
  let score = 75;
  const now = new Date().getTime();

  const checkRecency = (item) => {
    if (!item?.lastWornAt) {
      return 15; // Never worn bonus
    }
    const wornTime = new Date(item.lastWornAt).getTime();
    const hoursSinceWorn = (now - wornTime) / (1000 * 60 * 60);

    if (hoursSinceWorn < 24) return -25; // Heavily penalize clothes worn today
    if (hoursSinceWorn < 48) return -15; // Penalize clothes worn yesterday
    if (hoursSinceWorn > 168) return 10; // Bonus for clothes not worn in over a week
    return 0;
  };

  score += checkRecency(top);
  score += checkRecency(bottom);

  return Math.min(100, Math.max(30, score));
};

/**
 * Core outfit recommendation engine
 */
export const generateOutfitRecommendations = async ({
  userId,
  occasion = 'Casual Hangout',
  weather,
  lockedItemId = null,
  stylePreference = 'Casual',
}) => {
  // 1. Fetch user's entire wardrobe
  const userClothes = await db.select().from(clothes).where(eq(clothes.userId, userId));

  if (userClothes.length === 0) {
    const error = new Error('Lemari pakaian Anda masih kosong. Silakan tambahkan pakaian terlebih dahulu.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Classify items into category buckets
  const tops = userClothes.filter((c) => c.category.toLowerCase() === 'tops');
  const bottoms = userClothes.filter((c) => c.category.toLowerCase() === 'bottoms');
  const outers = userClothes.filter((c) => c.category.toLowerCase() === 'outerwear');
  const footwears = userClothes.filter((c) => c.category.toLowerCase() === 'footwear');

  // Check mandatory categories
  if (tops.length === 0 || bottoms.length === 0) {
    const error = new Error(
      'Koleksi lemari belum lengkap. Silakan unggah minimal 1 Atasan (Tops) dan 1 Bawahan (Bottoms) untuk membuat outfit.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Handle locked item if specified
  let candidateTops = [...tops];
  let candidateBottoms = [...bottoms];
  let candidateOuters = [...outers];
  let candidateFootwears = [...footwears];
  let lockOuter = false;
  let lockFootwear = false;

  if (lockedItemId) {
    const lockedItem = userClothes.find((c) => c.id === lockedItemId);
    if (!lockedItem) {
      const error = new Error('Pakaian yang dikunci (lockedItemId) tidak ditemukan dalam lemari Anda.');
      error.statusCode = 404;
      throw error;
    }

    const cat = lockedItem.category.toLowerCase();
    if (cat === 'tops') {
      candidateTops = [lockedItem];
    } else if (cat === 'bottoms') {
      candidateBottoms = [lockedItem];
    } else if (cat === 'outerwear') {
      candidateOuters = [lockedItem];
      lockOuter = true;
    } else if (cat === 'footwear') {
      candidateFootwears = [lockedItem];
      lockFootwear = true;
    }
  }

  // 4. Formulate candidate combinations
  const combinations = [];

  // Determine outer candidates
  const outerOptions = lockOuter
    ? candidateOuters
    : weather.isCold || weather.isRain
    ? [...candidateOuters, null]
    : [null, ...candidateOuters];

  // Determine footwear candidates (pick available or null)
  const footwearOptions = candidateFootwears.length > 0 ? candidateFootwears : [null];

  for (const top of candidateTops) {
    for (const bottom of candidateBottoms) {
      for (const outer of outerOptions) {
        for (const footwear of footwearOptions) {
          // Calculate scores
          const harmony = calculateOutfitHarmony(top, bottom, outer, footwear);
          const weatherScore = calculateWeatherScore(top, bottom, outer, weather);
          const occasionScore = calculateOccasionScore(top, bottom, outer, occasion, stylePreference);
          const rotationScore = calculateRotationScore(top, bottom);

          // Weighted final score (Harmony: 40%, Weather: 30%, Occasion: 20%, Rotation: 10%)
          const finalScore = Math.round(
            harmony.score * 0.4 +
            weatherScore * 0.3 +
            occasionScore * 0.2 +
            rotationScore * 0.1
          );

          const reasonNotes = [];
          if (harmony.score >= 85) reasonNotes.push(`harmoni warna ${harmony.harmonyType.toLowerCase()} yang memikat`);
          if (weatherScore >= 85) reasonNotes.push(`sangat nyaman untuk cuaca ${weather.city} (${weather.temperature}°C)`);
          if (occasionScore >= 85) reasonNotes.push(`sesuai tema ${occasion}`);

          const matchReason = reasonNotes.length > 0
            ? `Pilihan tepat dengan ${reasonNotes.join(', ')}.`
            : `Kombinasi kasual serasi untuk aktivitas ${occasion}.`;

          combinations.push({
            score: finalScore,
            harmonyScore: harmony.score,
            harmonyType: harmony.harmonyType,
            weatherScore,
            occasionScore,
            rotationScore,
            top,
            bottom,
            outer: outer || null,
            footwear: footwear || null,
            matchReason,
          });
        }
      }
    }
  }

  // 5. Sort combinations descending by score
  combinations.sort((a, b) => b.score - a.score);

  // 6. Select top 3 diverse combinations
  const topRecommendations = [];
  for (const combo of combinations) {
    if (topRecommendations.length >= 3) break;

    // Check diversity: avoid returning exact same top + bottom combo twice if alternatives exist
    const isDuplicatePair = topRecommendations.some(
      (rec) => rec.top.id === combo.top.id && rec.bottom.id === combo.bottom.id && rec.outer?.id === combo.outer?.id
    );

    if (!isDuplicatePair || combinations.length <= 3) {
      topRecommendations.push(combo);
    }
  }

  // If diversity filter resulted in fewer than 3, fill up with next best
  if (topRecommendations.length < 3 && combinations.length > topRecommendations.length) {
    for (const combo of combinations) {
      if (topRecommendations.length >= 3) break;
      if (!topRecommendations.includes(combo)) {
        topRecommendations.push(combo);
      }
    }
  }

  return topRecommendations;
};
