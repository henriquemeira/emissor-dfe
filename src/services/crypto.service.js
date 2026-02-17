const crypto = require('crypto');
const { config } = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SCRYPT_N = 16384; // CPU/memory cost parameter

/**
 * Derives a cryptographic key from the master encryption key using scrypt
 * @param {Buffer} salt - Random salt
 * @returns {Buffer} Derived key
 */
function deriveKey(salt) {
  return crypto.scryptSync(
    config.security.encryptionKey,
    salt,
    KEY_LENGTH,
    { N: SCRYPT_N }
  );
}

/**
 * Encrypts data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Base64 encoded encrypted data (salt:iv:authTag:encrypted)
 */
function encrypt(plaintext) {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine all components: salt:iv:authTag:encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedData) {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from master key and salt
    const key = deriveKey(salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypts a file buffer (for certificates)
 * @param {Buffer} fileBuffer - File buffer to encrypt
 * @returns {string} Base64 encoded encrypted data
 */
function encryptFile(fileBuffer) {
  return encrypt(fileBuffer.toString('base64'));
}

/**
 * Decrypts an encrypted file
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Buffer} Decrypted file buffer
 */
function decryptFile(encryptedData) {
  const decryptedBase64 = decrypt(encryptedData);
  return Buffer.from(decryptedBase64, 'base64');
}

module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
};
