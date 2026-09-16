/**
 * Color Harmony Evaluation Engine
 * Based on fashion color theory and complementary color pairing
 */

// Color classification dictionary
const COLOR_FAMILIES = {
  neutrals: [
    'hitam', 'black',
    'putih', 'white',
    'abu-abu', 'abu', 'grey', 'gray',
    'krem', 'cream', 'beige',
    'khaki', 'denim', 'cokelat muda'
  ],
  earthy: [
    'cokelat', 'brown',
    'terracotta', 'terrakota',
    'olive', 'army',
    'mustard', 'sage', 'maroon', 'marun'
  ],
  cool: [
    'biru', 'blue',
    'navy', 'dongker',
    'hijau', 'green',
    'tosca', 'teal',
    'ungu', 'purple', 'lilac'
  ],
  warm: [
    'merah', 'red',
    'kuning', 'yellow',
    'oranye', 'orange',
    'pink', 'merah muda', 'coral'
  ]
};

const normalizeColor = (colorStr = '') => {
  return colorStr.toLowerCase().trim();
};

const getFamily = (color) => {
  const norm = normalizeColor(color);
  for (const [family, list] of Object.entries(COLOR_FAMILIES)) {
    if (list.some((c) => norm.includes(c))) {
      return family;
    }
  }
  return 'unknown';
};

const isNeutral = (color) => {
  return getFamily(color) === 'neutrals';
};

/**
 * Evaluates pairwise color harmony between two items (e.g. Top & Bottom)
 */
export const evaluatePairColorHarmony = (colorA, colorB) => {
  const normA = normalizeColor(colorA);
  const normB = normalizeColor(colorB);

  // 1. Exact Match or Tone-on-Tone (Monochromatic)
  if (normA === normB) {
    return {
      score: 90,
      type: 'Monochromatic',
      reason: 'Padu-padan senada (monokromatik) yang memberikan ilusi siluet rapi dan ramping.',
    };
  }

  const isANeutral = isNeutral(normA);
  const isBNeutral = isNeutral(normB);

  // 2. Both are Neutrals (Classic Anchor)
  if (isANeutral && isBNeutral) {
    return {
      score: 95,
      type: 'Classic Neutral',
      reason: 'Kombinasi warna netral klasik yang tidak pernah salah, terlihat tenang dan berkelas.',
    };
  }

  // 3. One Neutral + One Color (Neutral Buffer)
  if (isANeutral || isBNeutral) {
    return {
      score: 88,
      type: 'Neutral Anchor',
      reason: 'Warna netral berfungsi sebagai penyeimbang yang menonjolkan warna pakaian utama.',
    };
  }

  const familyA = getFamily(normA);
  const familyB = getFamily(normB);

  // 4. Complementary & Known Harmonious Combinations
  const isNavyAndEarth =
    (normA.includes('navy') || normA.includes('biru')) &&
    (normB.includes('cokelat') || normB.includes('krem') || normB.includes('khaki') || normB.includes('mustard'));
  const isEarthAndNavy =
    (normB.includes('navy') || normB.includes('biru')) &&
    (normA.includes('cokelat') || normA.includes('krem') || normA.includes('khaki') || normA.includes('mustard'));

  if (isNavyAndEarth || isEarthAndNavy) {
    return {
      score: 94,
      type: 'Complementary Contrast',
      reason: 'Kontras komplementer antara warna dingin dan nuansa hangat yang sangat elegan.',
    };
  }

  const isOliveAndEarth =
    (normA.includes('olive') || normA.includes('army') || normA.includes('sage')) &&
    (normB.includes('terracotta') || normB.includes('maroon') || normB.includes('cokelat'));
  const isEarthAndOlive =
    (normB.includes('olive') || normB.includes('army') || normB.includes('sage')) &&
    (normA.includes('terracotta') || normA.includes('maroon') || normA.includes('cokelat'));

  if (isOliveAndEarth || isEarthAndOlive) {
    return {
      score: 92,
      type: 'Earthy Harmony',
      reason: 'Perpaduan warna alam (earth-tone) yang hangat, tenang, dan estetik.',
    };
  }

  // 5. Same Family non-neutral (Analogous)
  if (familyA === familyB && familyA !== 'unknown') {
    return {
      score: 85,
      type: 'Analogous',
      reason: 'Warna berada dalam rumpun yang sama, menghasilkan gradasi visual yang harmonis.',
    };
  }

  // 6. Default / Clashing penalty
  return {
    score: 70,
    type: 'Contrast',
    reason: 'Kombinasi kontras yang menarik untuk gaya kasual yang berani.',
  };
};

/**
 * Calculates overall harmony for an entire outfit set
 */
export const calculateOutfitHarmony = (top, bottom, outer = null, footwear = null) => {
  const topBottomHarmony = evaluatePairColorHarmony(top.color, bottom.color);
  let totalScore = topBottomHarmony.score;
  let count = 1;

  if (outer) {
    const outerTop = evaluatePairColorHarmony(outer.color, top.color);
    const outerBottom = evaluatePairColorHarmony(outer.color, bottom.color);
    totalScore += (outerTop.score + outerBottom.score) / 2;
    count += 1;
  }

  if (footwear) {
    const footBottom = evaluatePairColorHarmony(footwear.color, bottom.color);
    totalScore += footBottom.score;
    count += 1;
  }

  const averageScore = Math.round(totalScore / count);

  return {
    score: averageScore,
    harmonyType: topBottomHarmony.type,
    reason: topBottomHarmony.reason,
  };
};