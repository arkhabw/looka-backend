import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, clothes, outfits, outfitLogs } from './schema.js';

/**
 * Pure Node.js PNG file generator for sample clothing images
 */
function createPngBuffer(width, height, r, g, b) {
  function crc32(buf) {
    let table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    let crc = 0 ^ -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk('IHDR', ihdrData);

  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      // Add subtle vignette/frame border
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      rawData[pxOffset] = isBorder ? Math.max(0, r - 30) : r;
      rawData[pxOffset + 1] = isBorder ? Math.max(0, g - 30) : g;
      rawData[pxOffset + 2] = isBorder ? Math.max(0, b - 30) : b;
    }
  }

  const idat = chunk('IDAT', zlib.deflateSync(rawData));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const seedDatabase = async () => {
  console.log('[SEED] Starting Looka database seeder...');

  const uploadDir = path.resolve('uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 1. Create or Find Demo User
  const demoEmail = 'demo@looka.id';
  let [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, demoEmail))
    .limit(1);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);

  if (!demoUser) {
    [demoUser] = await db
      .insert(users)
      .values({
        email: demoEmail,
        username: 'Stella',
        password: hashedPassword,
        stylePreference: 'Casual',
        city: 'Jakarta',
      })
      .returning();
    console.log(`[SEED] Created demo user: ${demoUser.email} (id: ${demoUser.id})`);
  } else {
    [demoUser] = await db
      .update(users)
      .set({
        username: 'Stella',
        password: hashedPassword,
        stylePreference: 'Casual',
        city: 'Jakarta',
      })
      .where(eq(users.id, demoUser.id))
      .returning();
    console.log(`[SEED] Updated demo user: ${demoUser.email} (id: ${demoUser.id})`);
  }

  const userId = demoUser.id;

  // 2. Clean previous user data for clean idempotency
  await db.delete(outfitLogs).where(eq(outfitLogs.userId, userId));
  await db.delete(outfits).where(eq(outfits.userId, userId));
  await db.delete(clothes).where(eq(clothes.userId, userId));
  console.log('[SEED] Cleaned previous user clothes and outfits.');

  // 3. Define Seed Clothes Specifications
  const seedItemsDef = [
    {
      name: 'White Knit Top',
      category: 'Tops',
      color: 'White',
      style: 'Casual',
      occasion: 'Campus',
      weather: 'Warm',
      rgb: [248, 245, 240],
      filename: 'clothing-seed-white-knit-top.png',
      lastWornDaysAgo: 1,
    },
    {
      name: 'Black Tailored Blazer',
      category: 'Outerwear',
      color: 'Black',
      style: 'Formal',
      occasion: 'Work',
      weather: 'Cool',
      rgb: [40, 42, 48],
      filename: 'clothing-seed-black-blazer.png',
      lastWornDaysAgo: 3,
    },
    {
      name: 'Straight Denim Jeans',
      category: 'Bottoms',
      color: 'Blue',
      style: 'Casual',
      occasion: 'Casual Hangout',
      weather: 'All Weather',
      rgb: [80, 115, 160],
      filename: 'clothing-seed-straight-jeans.png',
      lastWornDaysAgo: 1,
    },
    {
      name: 'White Minimalist Sneakers',
      category: 'Footwear',
      color: 'White',
      style: 'Casual',
      occasion: 'Casual Hangout',
      weather: 'All Weather',
      rgb: [242, 242, 246],
      filename: 'clothing-seed-white-sneakers.png',
      lastWornDaysAgo: 1,
    },
    {
      name: 'Striped Oxford Shirt',
      category: 'Tops',
      color: 'Blue',
      style: 'Smart Casual',
      occasion: 'Campus',
      weather: 'Warm',
      rgb: [130, 170, 215],
      filename: 'clothing-seed-striped-shirt.png',
      lastWornDaysAgo: 3,
    },
    {
      name: 'Beige Cardigan',
      category: 'Tops',
      color: 'Beige',
      style: 'Casual',
      occasion: 'Casual Hangout',
      weather: 'Cool',
      rgb: [225, 205, 180],
      filename: 'clothing-seed-beige-cardigan.png',
      lastWornDaysAgo: null, // Neglected item
    },
    {
      name: 'Black Chino Trousers',
      category: 'Bottoms',
      color: 'Black',
      style: 'Formal',
      occasion: 'Work',
      weather: 'All Weather',
      rgb: [50, 52, 58],
      filename: 'clothing-seed-black-chino.png',
      lastWornDaysAgo: 3,
    },
    {
      name: 'Denim Oversized Jacket',
      category: 'Outerwear',
      color: 'Blue',
      style: 'Streetwear',
      occasion: 'Casual Hangout',
      weather: 'Cool',
      rgb: [65, 100, 145],
      filename: 'clothing-seed-denim-jacket.png',
      lastWornDaysAgo: 1,
    },
    {
      name: 'Classic Black Loafers',
      category: 'Footwear',
      color: 'Black',
      style: 'Formal',
      occasion: 'Work',
      weather: 'All Weather',
      rgb: [45, 38, 35],
      filename: 'clothing-seed-black-loafers.png',
      lastWornDaysAgo: 3,
    },
    {
      name: 'Canvas Tote Bag',
      category: 'Accessories',
      color: 'Beige',
      style: 'Minimalist',
      occasion: 'Campus',
      weather: 'All Weather',
      rgb: [228, 215, 195],
      filename: 'clothing-seed-canvas-tote.png',
      lastWornDaysAgo: null, // Neglected item
    },
  ];

  // 4. Generate Images and Insert Clothes
  const insertedClothes = [];
  const now = new Date();

  for (const item of seedItemsDef) {
    const pngBuf = createPngBuffer(300, 300, item.rgb[0], item.rgb[1], item.rgb[2]);
    const filePath = path.join(uploadDir, item.filename);
    fs.writeFileSync(filePath, pngBuf);

    let lastWornAt = null;
    if (item.lastWornDaysAgo !== null) {
      lastWornAt = new Date(now.getTime() - item.lastWornDaysAgo * 24 * 60 * 60 * 1000);
    }

    const [created] = await db
      .insert(clothes)
      .values({
        userId,
        name: item.name,
        category: item.category,
        color: item.color,
        style: item.style,
        occasion: item.occasion,
        weather: item.weather,
        imageUrl: item.filename,
        lastWornAt,
      })
      .returning();

    insertedClothes.push(created);
  }

  console.log(`[SEED] Seeded ${insertedClothes.length} clothing items.`);

  // Find items by name for outfit assembly
  const findItem = (name) => insertedClothes.find((c) => c.name === name);

  const whiteTop = findItem('White Knit Top');
  const blueJeans = findItem('Straight Denim Jeans');
  const denimJacket = findItem('Denim Oversized Jacket');
  const whiteSneakers = findItem('White Minimalist Sneakers');

  const stripedShirt = findItem('Striped Oxford Shirt');
  const blackChino = findItem('Black Chino Trousers');
  const blackBlazer = findItem('Black Tailored Blazer');
  const blackLoafers = findItem('Classic Black Loafers');

  // 5. Seed Outfits (Lookbook)
  const [outfit1] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Campus Casual Look',
      topId: whiteTop?.id,
      bottomId: blueJeans?.id,
      outerId: denimJacket?.id,
      footwearId: whiteSneakers?.id,
      occasion: 'Campus',
      isFavorite: true,
    })
    .returning();

  const [outfit2] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Office Smart Formal',
      topId: stripedShirt?.id,
      bottomId: blackChino?.id,
      outerId: blackBlazer?.id,
      footwearId: blackLoafers?.id,
      occasion: 'Work',
      isFavorite: true,
    })
    .returning();

  console.log('[SEED] Seeded 2 Lookbook outfits.');

  // 6. Seed Calendar Wear Logs
  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dayToday = formatDateKey(now);
  const day3DaysAgo = formatDateKey(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000));
  const day5DaysAgo = formatDateKey(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000));

  await db.insert(outfitLogs).values([
    {
      userId,
      outfitId: outfit1.id,
      wornDate: dayToday,
      notes: 'Worn for project finalization and team sprint.',
    },
    {
      userId,
      outfitId: outfit2.id,
      wornDate: day3DaysAgo,
      notes: 'Worn for presentation review and faculty meeting.',
    },
    {
      userId,
      outfitId: outfit1.id,
      wornDate: day5DaysAgo,
      notes: 'Comfortable casual style for studying at campus library.',
    },
  ]);

  console.log('[SEED] Seeded 3 OOTD Calendar entries.');
  console.log('====================================================');
  console.log('[SEED] Looka Database Seeding Completed Successfully!');
  console.log('Demo Account: demo@looka.id / Password123!');
  console.log('====================================================');

  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
