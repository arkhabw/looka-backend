import { pgTable, serial, text, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull(),
  password: text('password').notNull(),
  stylePreference: varchar('style_preference', { length: 50 }).default('Casual'),
  city: varchar('city', { length: 100 }).default('Jakarta'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Clothes Table
export const clothes = pgTable('clothes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(), // Tops, Bottoms, Outerwear, Footwear, Accessories
  color: varchar('color', { length: 50 }).notNull(),
  style: varchar('style', { length: 50 }).default('Casual'), // Casual, Formal, Streetwear, etc.
  occasion: varchar('occasion', { length: 50 }).default('Casual Hangout'),
  weather: varchar('weather', { length: 50 }).default('All Weather'),
  imageUrl: text('image_url').notNull(),
  lastWornAt: timestamp('last_worn_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Outfits Table (Favorites / Saved Outfits)
export const outfits = pgTable('outfits', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).default('My Outfit'),
  topId: integer('top_id').references(() => clothes.id, { onDelete: 'set null' }),
  bottomId: integer('bottom_id').references(() => clothes.id, { onDelete: 'set null' }),
  outerId: integer('outer_id').references(() => clothes.id, { onDelete: 'set null' }),
  footwearId: integer('footwear_id').references(() => clothes.id, { onDelete: 'set null' }),
  occasion: varchar('occasion', { length: 50 }).default('Casual'),
  isFavorite: boolean('is_favorite').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Outfit Logs Table (Wear History / Calendar)
export const outfitLogs = pgTable('outfit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  outfitId: integer('outfit_id').references(() => outfits.id, { onDelete: 'set null' }),
  wornDate: varchar('worn_date', { length: 10 }).notNull(), // Format YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  clothes: many(clothes),
  outfits: many(outfits),
  outfitLogs: many(outfitLogs),
}));

export const clothesRelations = relations(clothes, ({ one }) => ({
  user: one(users, {
    fields: [clothes.userId],
    references: [users.id],
  }),
}));

export const outfitsRelations = relations(outfits, ({ one, many }) => ({
  user: one(users, {
    fields: [outfits.userId],
    references: [users.id],
  }),
  top: one(clothes, {
    fields: [outfits.topId],
    references: [clothes.id],
  }),
  bottom: one(clothes, {
    fields: [outfits.bottomId],
    references: [clothes.id],
  }),
  outer: one(clothes, {
    fields: [outfits.outerId],
    references: [clothes.id],
  }),
  footwear: one(clothes, {
    fields: [outfits.footwearId],
    references: [clothes.id],
  }),
  logs: many(outfitLogs),
}));

export const outfitLogsRelations = relations(outfitLogs, ({ one }) => ({
  user: one(users, {
    fields: [outfitLogs.userId],
    references: [users.id],
  }),
  outfit: one(outfits, {
    fields: [outfitLogs.outfitId],
    references: [outfits.id],
  }),
}));