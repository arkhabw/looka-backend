import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

// Ensure Cloudinary is configured from environment variables
if (ENV.CLOUDINARY_URL && ENV.CLOUDINARY_URL.startsWith('cloudinary://')) {
  try {
    const parsed = new URL(ENV.CLOUDINARY_URL);
    cloudinary.config({
      cloud_name: parsed.hostname,
      api_key: parsed.username,
      api_secret: parsed.password,
      secure: true,
    });
  } catch (err) {
    console.warn('[CLOUDINARY] Failed to parse CLOUDINARY_URL:', err.message);
  }
}

/**
 * Checks whether Cloudinary is configured and ready
 */
export const isCloudinaryConfigured = () => {
  const conf = cloudinary.config();
  return Boolean(conf.cloud_name && conf.api_key && conf.api_secret);
};

/**
 * Helper to delete an image from Cloudinary by its URL or publicId
 */
export const deleteFromCloudinary = async (imageUrlOrPublicId) => {
  if (!imageUrlOrPublicId || !isCloudinaryConfigured()) return;

  try {
    let publicId = imageUrlOrPublicId;

    // If it's a full Cloudinary URL, extract the publicId (e.g. looka_clothes/filename)
    if (imageUrlOrPublicId.startsWith('http')) {
      const match = imageUrlOrPublicId.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.warn('[CLOUDINARY] Failed to delete image:', err.message);
  }
};

export default cloudinary;
