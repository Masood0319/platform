import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {object} options - Cloudinary upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
export const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    const result = await cloudinaryV2.uploader.upload(filePath, {
      ...options,
      resource_type: 'auto',
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Cloudinary delete result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinaryV2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file objects with path and fieldname
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, folder = 'verifications') => {
  const uploadPromises = files.map(file => {
    return uploadToCloudinary(file.path, {
      folder: `${folder}/${Date.now()}`,
      resource_type: 'auto',
    });
  });
  
  return await Promise.all(uploadPromises);
};

/**
 * Get public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
export const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  return publicId;
};