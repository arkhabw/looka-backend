import 'dotenv/config';

export default {
  schema: './src/db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://looka:looka123@localhost:5432/looka_db',
  },
};