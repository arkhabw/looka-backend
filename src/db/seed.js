import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, clothes, outfits, outfitLogs } from './schema.js';

// 42 Curated Real Apparel & Fashion Items (Casual, Streetwear, Smart Casual, Formal, Sporty)
const REAL_CLOTHES_CATALOG = [
  // ==================== TOPS (12 items) ====================
  {
    name: 'White Knit Crewneck T-Shirt',
    category: 'Tops',
    color: 'Putih',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
    filename: 'clothing-white-crewneck.jpg',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 1,
  },
  {
    name: 'Striped Oxford Button-Down',
    category: 'Tops',
    color: 'Biru',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-blue-oxford.jpg',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 3,
  },
  {
    name: 'Cozy Beige Knit Cardigan',
    category: 'Tops',
    color: 'Beige',
    style: 'Casual',
    occasion: 'Campus',
    weather: 'Cool',
    filename: 'clothing-beige-cardigan.jpg',
    url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Black Silk Evening Blouse',
    category: 'Tops',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Date',
    weather: 'All Weather',
    filename: 'clothing-black-blouse.jpg',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 5,
  },
  {
    name: 'Olive Oversized Cotton Tee',
    category: 'Tops',
    color: 'Hijau',
    style: 'Streetwear',
    occasion: 'Casual Hangout',
    weather: 'Warm',
    filename: 'clothing-olive-tee.jpg',
    url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Heather Grey Essential Hoodie',
    category: 'Tops',
    color: 'Abu-Abu',
    style: 'Casual',
    occasion: 'Campus',
    weather: 'Cool',
    filename: 'clothing-grey-hoodie.jpg',
    url: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 2,
  },
  {
    name: 'Vintage Graphic Boxy Tee',
    category: 'Tops',
    color: 'Hitam',
    style: 'Streetwear',
    occasion: 'Casual Hangout',
    weather: 'Warm',
    filename: 'clothing-graphic-tee.jpg',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Minimalist Black Fitted Tee',
    category: 'Tops',
    color: 'Hitam',
    style: 'Minimalist',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
    filename: 'clothing-black-tee.jpg',
    url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 7,
  },
  {
    name: 'Breathable Linen Resort Shirt',
    category: 'Tops',
    color: 'Putih',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Hot',
    filename: 'clothing-linen-shirt.jpg',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Rustic Plaid Flannel Shirt',
    category: 'Tops',
    color: 'Merah',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Cool',
    filename: 'clothing-plaid-flannel.jpg',
    url: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 4,
  },
  {
    name: 'Cream Knit Turtleneck Sweater',
    category: 'Tops',
    color: 'Krem',
    style: 'Formal',
    occasion: 'Work',
    weather: 'Cold',
    filename: 'clothing-cream-turtleneck.jpg',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Mustard Cable-Knit Pullover',
    category: 'Tops',
    color: 'Kuning',
    style: 'Smart Casual',
    occasion: 'Campus',
    weather: 'Cold',
    filename: 'clothing-cable-sweater.jpg',
    url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 6,
  },

  // ==================== BOTTOMS (10 items) ====================
  {
    name: 'Straight-Leg Denim Jeans',
    category: 'Bottoms',
    color: 'Biru',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
    filename: 'clothing-straight-jeans.jpg',
    url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 1,
  },
  {
    name: 'Tailored Black Chino Trousers',
    category: 'Bottoms',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-black-chino.jpg',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 3,
  },
  {
    name: 'Pleated Khaki Wide-Leg Pants',
    category: 'Bottoms',
    color: 'Khaki',
    style: 'Smart Casual',
    occasion: 'Campus',
    weather: 'Warm',
    filename: 'clothing-khaki-pants.jpg',
    url: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Grey Wool Formal Trousers',
    category: 'Bottoms',
    color: 'Abu-Abu',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-grey-trousers.jpg',
    url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 5,
  },
  {
    name: 'Light Wash Ripped Jeans',
    category: 'Bottoms',
    color: 'Biru Muda',
    style: 'Streetwear',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
    filename: 'clothing-light-wash-jeans.jpg',
    url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Slim-Fit Jet Black Denim',
    category: 'Bottoms',
    color: 'Hitam',
    style: 'Casual',
    occasion: 'Date',
    weather: 'All Weather',
    filename: 'clothing-black-denim.jpg',
    url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 2,
  },
  {
    name: 'Relaxed Beige Cargo Pants',
    category: 'Bottoms',
    color: 'Beige',
    style: 'Streetwear',
    occasion: 'Weekend',
    weather: 'Warm',
    filename: 'clothing-beige-cargo.jpg',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'White Linen Summer Trousers',
    category: 'Bottoms',
    color: 'Putih',
    style: 'Minimalist',
    occasion: 'Weekend',
    weather: 'Hot',
    filename: 'clothing-linen-trousers.jpg',
    url: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 8,
  },
  {
    name: 'Classic Denim Casual Shorts',
    category: 'Bottoms',
    color: 'Biru',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Hot',
    filename: 'clothing-denim-shorts.jpg',
    url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Tailored Suit Waistcoat Vest',
    category: 'Bottoms',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Formal Party',
    weather: 'All Weather',
    filename: 'clothing-suit-vest.jpg',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },

  // ==================== OUTERWEAR (8 items) ====================
  {
    name: 'Structured Black Tailored Blazer',
    category: 'Outerwear',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Work',
    weather: 'Cool',
    filename: 'clothing-black-blazer.jpg',
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 3,
  },
  {
    name: 'Classic Blue Denim Jacket',
    category: 'Outerwear',
    color: 'Biru',
    style: 'Streetwear',
    occasion: 'Casual Hangout',
    weather: 'Cool',
    filename: 'clothing-denim-jacket.jpg',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 1,
  },
  {
    name: 'Camel Wool Trench Coat',
    category: 'Outerwear',
    color: 'Cokelat',
    style: 'Formal',
    occasion: 'Date',
    weather: 'Cold',
    filename: 'clothing-camel-coat.jpg',
    url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Black Moto Leather Biker Jacket',
    category: 'Outerwear',
    color: 'Hitam',
    style: 'Streetwear',
    occasion: 'Date',
    weather: 'Cool',
    filename: 'clothing-leather-jacket.jpg',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Down Puffer Winter Jacket',
    category: 'Outerwear',
    color: 'Hitam',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Cold',
    filename: 'clothing-puffer-jacket.jpg',
    url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Vintage Caramel Corduroy Jacket',
    category: 'Outerwear',
    color: 'Cokelat',
    style: 'Smart Casual',
    occasion: 'Campus',
    weather: 'Cool',
    filename: 'clothing-corduroy-jacket.jpg',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 4,
  },
  {
    name: 'Olive Green Military Bomber',
    category: 'Outerwear',
    color: 'Hijau',
    style: 'Streetwear',
    occasion: 'Casual Hangout',
    weather: 'Cool',
    filename: 'clothing-bomber-jacket.jpg',
    url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Pastel Floral Kimono Outer',
    category: 'Outerwear',
    color: 'Pink',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Warm',
    filename: 'clothing-kimono-outer.jpg',
    url: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 9,
  },

  // ==================== FOOTWEAR (8 items) ====================
  {
    name: 'White Minimalist Leather Sneakers',
    category: 'Footwear',
    color: 'Putih',
    style: 'Casual',
    occasion: 'Casual Hangout',
    weather: 'All Weather',
    filename: 'clothing-white-sneakers.jpg',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 1,
  },
  {
    name: 'Classic Black Leather Loafers',
    category: 'Footwear',
    color: 'Hitam',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-black-loafers.jpg',
    url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 3,
  },
  {
    name: 'Brown Suede Chelsea Boots',
    category: 'Footwear',
    color: 'Cokelat',
    style: 'Smart Casual',
    occasion: 'Date',
    weather: 'All Weather',
    filename: 'clothing-chelsea-boots.jpg',
    url: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 5,
  },
  {
    name: 'Chunky Retro Colorblock Sneakers',
    category: 'Footwear',
    color: 'Putih',
    style: 'Streetwear',
    occasion: 'Weekend',
    weather: 'All Weather',
    filename: 'clothing-chunky-sneakers.jpg',
    url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Polished Dark Brown Oxford Shoes',
    category: 'Footwear',
    color: 'Cokelat',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-brown-oxfords.jpg',
    url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Elegant Beige Strappy Block Heels',
    category: 'Footwear',
    color: 'Beige',
    style: 'Formal',
    occasion: 'Date',
    weather: 'All Weather',
    filename: 'clothing-beige-heels.jpg',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Sporty Breathable Athletic Runners',
    category: 'Footwear',
    color: 'Hitam',
    style: 'Sporty',
    occasion: 'Workout',
    weather: 'All Weather',
    filename: 'clothing-athletic-runners.jpg',
    url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Classic Canvas High-Top Chucks',
    category: 'Footwear',
    color: 'Merah',
    style: 'Casual',
    occasion: 'Campus',
    weather: 'All Weather',
    filename: 'clothing-red-chucks.jpg',
    url: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },

  // ==================== ACCESSORIES (4 items) ====================
  {
    name: 'Genuine Leather Minimalist Tote Bag',
    category: 'Accessories',
    color: 'Cokelat',
    style: 'Smart Casual',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-leather-tote.jpg',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 3,
  },
  {
    name: 'Vintage Tortoiseshell Sunglasses',
    category: 'Accessories',
    color: 'Cokelat',
    style: 'Casual',
    occasion: 'Weekend',
    weather: 'Hot',
    filename: 'clothing-sunglasses.jpg',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
  {
    name: 'Minimalist Silver Mesh Watch',
    category: 'Accessories',
    color: 'Silver',
    style: 'Formal',
    occasion: 'Work',
    weather: 'All Weather',
    filename: 'clothing-silver-watch.jpg',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: 1,
  },
  {
    name: 'Washed Cotton Baseball Cap',
    category: 'Accessories',
    color: 'Navy',
    style: 'Casual',
    occasion: 'Campus',
    weather: 'All Weather',
    filename: 'clothing-baseball-cap.jpg',
    url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
    lastWornDaysAgo: null,
  },
];

/**
 * Downloads an image from URL and saves locally if not already present
 */
async function ensureLocalImage(uploadDir, filename, url) {
  const destPath = path.join(uploadDir, filename);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    return filename;
  }

  try {
    process.stdout.write(`  [DOWNLOAD] ${filename}... `);
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(destPath, buffer);
      console.log(`OK (${Math.round(buffer.length / 1024)} KB)`);
      return filename;
    }
  } catch (err) {
    console.log(`Fallback to URL (${err.message})`);
  }

  return url;
}

const seedUserWardrobe = async (user, uploadDir) => {
  const userId = user.id;
  console.log(`\n====================================================`);
  console.log(`[SEED] Seeding Wardrobe for: ${user.email} (id: ${userId})`);
  console.log(`====================================================`);

  // 1. Clean previous outfits, logs, and clothes for clean idempotent state
  await db.delete(outfitLogs).where(eq(outfitLogs.userId, userId));
  await db.delete(outfits).where(eq(outfits.userId, userId));
  await db.delete(clothes).where(eq(clothes.userId, userId));

  const now = new Date();
  const insertedClothes = [];

  // 2. Insert 42 clothes with real photos
  for (const item of REAL_CLOTHES_CATALOG) {
    const finalImage = await ensureLocalImage(uploadDir, item.filename, item.url);

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
        imageUrl: finalImage,
        lastWornAt,
      })
      .returning();

    insertedClothes.push(created);
  }

  console.log(`[SEED] Successfully inserted ${insertedClothes.length} realistic clothes!`);

  // Helper to find clothing by name
  const findItem = (name) => insertedClothes.find((c) => c.name === name);

  const whiteTee = findItem('White Knit Crewneck T-Shirt');
  const blueJeans = findItem('Straight-Leg Denim Jeans');
  const denimJacket = findItem('Classic Blue Denim Jacket');
  const whiteSneakers = findItem('White Minimalist Leather Sneakers');

  const oxfordShirt = findItem('Striped Oxford Button-Down');
  const blackChinos = findItem('Tailored Black Chino Trousers');
  const blackBlazer = findItem('Structured Black Tailored Blazer');
  const blackLoafers = findItem('Classic Black Leather Loafers');

  const blackBlouse = findItem('Black Silk Evening Blouse');
  const greyTrousers = findItem('Grey Wool Formal Trousers');
  const camelCoat = findItem('Camel Wool Trench Coat');
  const chelseaBoots = findItem('Brown Suede Chelsea Boots');

  const hoodie = findItem('Heather Grey Essential Hoodie');
  const cargoPants = findItem('Relaxed Beige Cargo Pants');
  const chunkySneakers = findItem('Chunky Retro Colorblock Sneakers');

  // 3. Seed 4 Diverse Curated Outfits (Lookbook)
  const [outfit1] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Weekend Casual Hangout',
      topId: whiteTee?.id,
      bottomId: blueJeans?.id,
      outerId: denimJacket?.id,
      footwearId: whiteSneakers?.id,
      occasion: 'Casual Hangout',
      isFavorite: true,
    })
    .returning();

  const [outfit2] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Office Smart Formal',
      topId: oxfordShirt?.id,
      bottomId: blackChinos?.id,
      outerId: blackBlazer?.id,
      footwearId: blackLoafers?.id,
      occasion: 'Work',
      isFavorite: true,
    })
    .returning();

  const [outfit3] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Evening Elegant Dinner',
      topId: blackBlouse?.id,
      bottomId: greyTrousers?.id,
      outerId: camelCoat?.id,
      footwearId: chelseaBoots?.id,
      occasion: 'Date',
      isFavorite: false,
    })
    .returning();

  const [outfit4] = await db
    .insert(outfits)
    .values({
      userId,
      name: 'Urban Streetwear Vibe',
      topId: hoodie?.id,
      bottomId: cargoPants?.id,
      outerId: null,
      footwearId: chunkySneakers?.id,
      occasion: 'Campus',
      isFavorite: true,
    })
    .returning();

  console.log('[SEED] Seeded 4 diverse Lookbook outfits (Casual, Formal, Date, Streetwear).');

  // 4. Seed Calendar History Logs
  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dayToday = formatDateKey(now);
  const day2DaysAgo = formatDateKey(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
  const day4DaysAgo = formatDateKey(new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000));
  const day6DaysAgo = formatDateKey(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  await db.insert(outfitLogs).values([
    {
      userId,
      outfitId: outfit1.id,
      wornDate: dayToday,
      notes: 'Dipakai santai sore dan jalan-jalan bersama teman.',
    },
    {
      userId,
      outfitId: outfit2.id,
      wornDate: day2DaysAgo,
      notes: 'Dipakai untuk presentasi kerja dan rapat divisi.',
    },
    {
      userId,
      outfitId: outfit3.id,
      wornDate: day4DaysAgo,
      notes: 'Makan malam formal bersama kolega.',
    },
    {
      userId,
      outfitId: outfit4.id,
      wornDate: day6DaysAgo,
      notes: 'Gaya santai untuk kuliah dan nongkrong di kafe kampus.',
    },
  ]);

  console.log('[SEED] Seeded 4 OOTD Calendar entries.');
};

const runSeeder = async () => {
  console.log('====================================================');
  console.log('🚀 LOOKA REAL PHOTO DATABASE SEEDER (42 APPAREL ITEMS)');
  console.log('====================================================');

  const uploadDir = path.resolve('uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);

  // 1. Ensure Demo User (demo@looka.id)
  let [demoUser] = await db.select().from(users).where(eq(users.email, 'demo@looka.id')).limit(1);
  if (!demoUser) {
    [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@looka.id',
        username: 'Stella',
        password: hashedPassword,
        stylePreference: 'Casual',
        city: 'Jakarta',
      })
      .returning();
  }
  await seedUserWardrobe(demoUser, uploadDir);

  // 2. Also Seed for Arkha user (arkha@gmail.com) if present
  let [arkhaUser] = await db.select().from(users).where(eq(users.email, 'arkha@gmail.com')).limit(1);
  if (arkhaUser) {
    await seedUserWardrobe(arkhaUser, uploadDir);
  }

  console.log('\n====================================================');
  console.log('🎉 SEEDING COMPLETE: 42 REAL APPAREL ITEMS SEEDED!');
  console.log('Akun Demo 1: demo@looka.id (Password: Password123!)');
  if (arkhaUser) {
    console.log('Akun Demo 2: arkha@gmail.com (Password: tetap sama)');
  }
  console.log('====================================================\n');

  process.exit(0);
};

runSeeder().catch((err) => {
  console.error('[FATAL SEED ERROR]', err);
  process.exit(1);
});
