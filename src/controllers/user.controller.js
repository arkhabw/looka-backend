import { getWardrobeAnalytics } from '../services/analytics.service.js';
import { successResponse } from '../utils/response.js';

/**
 * Controller to fetch wardrobe utilization analytics and sustainability insights
 * GET /api/users/analytics
 */
export const getUserAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const analytics = await getWardrobeAnalytics(userId);

    return successResponse(res, {
      statusCode: 200,
      message: 'Analitik pemanfaatan lemari berhasil diambil.',
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};
