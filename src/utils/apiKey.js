const { v4: uuidv4, validate: uuidValidate } = require('uuid');

/**
 * Generates a new API key using UUID v4
 * @returns {string} New API key
 */
function generateApiKey() {
  return uuidv4();
}

/**
 * Validates API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid UUID v4 format
 */
function isValidApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  return uuidValidate(apiKey);
}

module.exports = {
  generateApiKey,
  isValidApiKey,
};
