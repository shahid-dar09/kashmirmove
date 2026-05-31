const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary using environment variables
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('CLOUDINARY: Storage established and configured successfully.');
} else {
  console.warn('CLOUDINARY: Environment variables missing. Falling back to local storage.');
}

/**
 * Uploads a local file to Cloudinary
 * @param {string} localFilePath Path to the file on local disk
 * @param {string} folder Target folder name on Cloudinary
 * @returns {Promise<string|null>} The secure Cloudinary URL, or null if local fallback is required
 */
const uploadToCloudinary = async (localFilePath, folder = 'kashmirmove') => {
  if (!isCloudinaryConfigured) {
    return null;
  }

  try {
    const absolutePath = path.resolve(localFilePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`CLOUDINARY: File not found at path: ${absolutePath}`);
      return null;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(absolutePath, {
      folder: folder,
      resource_type: 'auto'
    });

    // Delete local temporary file to free up container space
    try {
      fs.unlinkSync(absolutePath);
      console.log(`CLOUDINARY: Cleaned up local file: ${absolutePath}`);
    } catch (err) {
      console.error('CLOUDINARY: Failed to delete local temporary file:', err.message);
    }

    return result.secure_url;
  } catch (error) {
    console.error('CLOUDINARY: Upload failed, falling back to local path. Error:', error.message);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  isCloudinaryConfigured: !!isCloudinaryConfigured
};
