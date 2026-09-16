import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { getWeatherForCity } from '../services/weather.service.js';
import { generateOutfitRecommendations } from '../services/recommendation.service.js';
import { generateStylistAdvice } from '../services/gemini.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller to generate daily outfit recommendations based on weather, color harmony, and style
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const query = req.query || {};

    const occasion = body.occasion || query.occasion || 'Casual Hangout';
    const rawLockedItem = body.lockedItemId !== undefined ? body.lockedItemId : query.lockedItemId;
    const lockedItemId = rawLockedItem ? Number(rawLockedItem) : null;
    const requestedCity = body.city || query.city;

    // 1. Fetch user profile for default city & style preference
    const [userProfile] = await db
      .select({
        city: users.city,
        stylePreference: users.stylePreference,
      })
      .from(users)
      .where(eq(users.id, userId));

    const targetCity = requestedCity || userProfile?.city || 'Jakarta';
    const stylePreference = userProfile?.stylePreference || 'Casual';

    // 2. Fetch weather info
    const weather = await getWeatherForCity(targetCity);

    // 3. Generate outfit combinations with scoring
    const recommendations = await generateOutfitRecommendations({
      userId,
      occasion,
      weather,
      lockedItemId,
      stylePreference,
    });

    // 4. Generate AI Stylist Review for the primary (#1) recommended outfit
    let stylistReview = null;
    if (recommendations.length > 0) {
      const topOutfit = recommendations[0];
      stylistReview = await generateStylistAdvice({
        outfit: topOutfit,
        occasion,
        weather,
        userPreference: stylePreference,
        harmony: {
          score: topOutfit.harmonyScore,
          harmonyType: topOutfit.harmonyType,
        },
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Rekomendasi outfit berhasil dihitung',
      data: {
        weather,
        occasion,
        city: targetCity,
        recommendationsCount: recommendations.length,
        recommendations,
        stylistAdvice: stylistReview?.stylistAdvice || null,
        stylistSource: stylistReview?.source || null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        message: error.message,
      });
    }
    next(error);
  }
};
