import 'dotenv/config';

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://looka:looka123@localhost:5432/looka_db',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey_looka_2026_ksm_multimedia',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
};
