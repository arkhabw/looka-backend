import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env.js';

let aiClient = null;

const getAiClient = () => {
  if (!aiClient && ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      aiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
    } catch (err) {
      console.warn('[GEMINI] Failed to initialize GoogleGenAI client:', err.message);
    }
  }
  return aiClient;
};

/**
 * Generates an AI Fashion Stylist review for a recommended outfit
 */
export const generateStylistAdvice = async ({
  outfit,
  occasion = 'Casual Hangout',
  weather,
  userPreference = 'Casual',
  harmony,
}) => {
  const client = getAiClient();

  // 1. Attempt generation via Google Gemini API if client is available
  if (client) {
    try {
      const topDesc = `${outfit.top.name} (Warna: ${outfit.top.color}, Style: ${outfit.top.style || 'Casual'})`;
      const bottomDesc = `${outfit.bottom.name} (Warna: ${outfit.bottom.color}, Style: ${outfit.bottom.style || 'Casual'})`;
      const outerDesc = outfit.outer ? `${outfit.outer.name} (Warna: ${outfit.outer.color})` : 'Tanpa Luaran';
      const footwearDesc = outfit.footwear ? `${outfit.footwear.name} (Warna: ${outfit.footwear.color})` : 'Sepatu Pilihan';

      const prompt = `Anda adalah seorang konsultan fashion stylist pribadi profesional untuk aplikasi "LOOKA".
Tolong berikan ulasan gaya (stylist review) yang singkat, elegan, bersahabat, dan meyakinkan (maksimal 2-3 kalimat) dalam Bahasa Indonesia untuk setelan pakaian berikut:

- Atasan: ${topDesc}
- Bawahan: ${bottomDesc}
- Luaran (Outerwear): ${outerDesc}
- Alas Kaki: ${footwearDesc}
- Acara / Agenda: ${occasion}
- Cuaca Hari Ini: ${weather.city}, ${weather.temperature}°C (${weather.description})
- Tipe Harmoni Warna: ${harmony.harmonyType} (Skor: ${harmony.score}/100)
- Gaya Favorit Pengguna: ${userPreference}

Jelaskan secara singkat mengapa kombinasi warna dan potongan ini cocok untuk acara dan cuaca tersebut, serta berikan satu tips styling singkat. Hindari penggunaan bullet points, langsung tuliskan dalam 1 paragraf mengalir.`;

      let response;
      try {
        response = await client.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
      } catch (errModel) {
        // Fallback to active lightweight model: gemini-3.5-flash-lite
        response = await client.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
        });
      }

      const text = response?.text?.trim();
      if (text) {
        return {
          stylistAdvice: text,
          source: 'gemini_ai',
        };
      }
    } catch (apiErr) {
      console.warn('[GEMINI] API call failed, falling back to rule-based advice:', apiErr.message);
    }
  }

  // 2. Intelligent Deterministic Fallback (when API key is absent or offline)
  const weatherNote = weather.isCold || weather.isRain
    ? `sangat pas menghadapi cuaca ${weather.temperature}°C yang sejuk`
    : `memberikan kenyamanan maksimal di suhu ${weather.temperature}°C`;

  const fallbackText = `Paduan ${outfit.top.name} dan ${outfit.bottom.name} menciptakan harmoni ${harmony.harmonyType} yang memikat untuk agenda ${occasion}. Komposisi ini ${weatherNote}, sekaligus menjaga penampilan Anda tetap percaya diri dan rapi.`;

  return {
    stylistAdvice: fallbackText,
    source: 'rule_based_engine',
  };
};