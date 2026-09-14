import { successResponse } from '../utils/response.js';
import { checkDatabaseConnection } from '../config/db.js';
import { ENV } from '../config/env.js';

export const getHealthCheck = async (req, res, next) => {
  try {
    const isDbConnected = await checkDatabaseConnection();
    
    return successResponse(res, {
      statusCode: 200,
      message: 'Looka Backend API is healthy and operational',
      data: {
        appName: 'Looka API',
        environment: ENV.NODE_ENV,
        database: isDbConnected ? 'connected' : 'disconnected',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};