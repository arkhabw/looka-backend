import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Access token required. Please provide a valid Bearer token in Authorization header.',
    });
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded; // Contains: { id, email, username }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Token expired. Please login again.',
      });
    }
    return errorResponse(res, {
      statusCode: 403,
      message: 'Invalid token.',
    });
  }
};