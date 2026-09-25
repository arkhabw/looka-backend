import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from './env.js';
import * as schema from '../db/schema.js';

const { Pool } = pg;

// Cloud databases (Neon, Supabase, Render, Railway) require SSL
const isCloudDatabase =
  ENV.NODE_ENV === 'production' ||
  (ENV.DATABASE_URL &&
    !ENV.DATABASE_URL.includes('localhost') &&
    !ENV.DATABASE_URL.includes('127.0.0.1') &&
    !ENV.DATABASE_URL.includes('postgres:5432'));

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: isCloudDatabase ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected error on idle PostgreSQL client', err);
});

export const db = drizzle(pool, { schema });

export const checkDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (error) {
    console.warn('[DATABASE] Connection warning:', error.message);
    return false;
  }
};