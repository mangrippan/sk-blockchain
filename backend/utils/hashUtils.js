/**
 * Hash Utilities
 * Functions for generating SHA-256 hashes from files and data
 */

const crypto = require('crypto');
const fs = require('fs').promises;

/**
 * Generate SHA-256 hash from file buffer
 * @param {Buffer} fileBuffer - File buffer
 * @returns {string} - Hex hash string
 */
function hashFileBuffer(fileBuffer) {
  return crypto
    .createHash('sha256')
    .update(fileBuffer)
    .digest('hex');
}

/**
 * Generate SHA-256 hash from file path
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - Hex hash string
 */
async function hashFile(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return hashFileBuffer(fileBuffer);
  } catch (error) {
    throw new Error(`Failed to hash file: ${error.message}`);
  }
}

/**
 * Generate SHA-256 hash from string data
 * @param {string} data - String data
 * @returns {string} - Hex hash string
 */
function hashString(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Verify file hash matches expected hash
 * @param {string} filePath - Path to file
 * @param {string} expectedHash - Expected hash value
 * @returns {Promise<boolean>} - True if matches
 */
async function verifyFileHash(filePath, expectedHash) {
  try {
    const actualHash = await hashFile(filePath);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
}

/**
 * Verify buffer hash matches expected hash
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} - True if matches
 */
function verifyBufferHash(fileBuffer, expectedHash) {
  const actualHash = hashFileBuffer(fileBuffer);
  return actualHash === expectedHash;
}

module.exports = {
  hashFile,
  hashFileBuffer,
  hashString,
  verifyFileHash,
  verifyBufferHash,
};
