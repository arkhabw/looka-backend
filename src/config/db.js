import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from './env.js';
import * as schema from '../db/schema.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
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