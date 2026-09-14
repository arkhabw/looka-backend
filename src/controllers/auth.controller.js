import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { ENV } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Helper to generate JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

/**
 * Controller: Register User
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, username, password, stylePreference, city } = req.body;

    // 1. Check if email already registered
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUsers.length > 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    // 2. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Insert into database
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        username: username.trim(),
        password: hashedPassword,
        stylePreference: stylePreference || 'Casual',
        city: city || 'Jakarta',
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        stylePreference: users.stylePreference,
        city: users.city,
        createdAt: users.createdAt,
      });

    // 4. Generate JWT Token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Registrasi berhasil. Akun Anda siap digunakan.',
      data: {
        token,
        user: newUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Login User
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Email atau password yang Anda masukkan salah.',
      });
    }

    // 2. Compare password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Email atau password yang Anda masukkan salah.',
      });
    }

    // 3. Generate JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      stylePreference: user.stylePreference,
      city: user.city,
      createdAt: user.createdAt,
    };

    return successResponse(res, {
      statusCode: 200,
      message: 'Login berhasil.',
      data: {
        token,
        user: userProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get Current User Profile (Me)
 * GET /api/auth/me
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        stylePreference: users.stylePreference,
        city: users.city,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Data profil pengguna berhasil dimuat.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update Profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, stylePreference, city } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };
    if (username) updateData.username = username.trim();
    if (stylePreference) updateData.stylePreference = stylePreference;
    if (city) updateData.city = city.trim();

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        stylePreference: users.stylePreference,
        city: users.city,
        updatedAt: users.updatedAt,
      });

    return successResponse(res, {
      statusCode: 200,
      message: 'Profil berhasil diperbarui.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};