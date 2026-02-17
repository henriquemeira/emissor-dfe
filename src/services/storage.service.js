const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { config } = require('../config/env');

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory() {
  try {
    await fs.access(config.storage.dataDir);
  } catch {
    await fs.mkdir(config.storage.dataDir, { recursive: true });
  }
}

/**
 * Gets the file path for an API key
 * @param {string} apiKey - The API key
 * @returns {string} Full file path
 */
function getFilePath(apiKey) {
  return path.join(config.storage.dataDir, `${apiKey}.json`);
}

/**
 * Checks if an account exists
 * @param {string} apiKey - The API key
 * @returns {Promise<boolean>} True if account exists
 */
async function accountExists(apiKey) {
  try {
    await fs.access(getFilePath(apiKey));
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves account data to disk
 * @param {string} apiKey - The API key
 * @param {Object} data - Account data to save
 */
async function saveAccount(apiKey, data) {
  await ensureDataDirectory();
  const filePath = getFilePath(apiKey);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Loads account data from disk
 * @param {string} apiKey - The API key
 * @returns {Promise<Object>} Account data
 */
async function loadAccount(apiKey) {
  const filePath = getFilePath(apiKey);
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('ACCOUNT_NOT_FOUND');
    }
    throw error;
  }
}

/**
 * Deletes an account from disk
 * @param {string} apiKey - The API key
 */
async function deleteAccount(apiKey) {
  const filePath = getFilePath(apiKey);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('ACCOUNT_NOT_FOUND');
    }
    throw error;
  }
}

/**
 * Lists all API keys (account files)
 * @returns {Promise<string[]>} Array of API keys
 */
async function listApiKeys() {
  await ensureDataDirectory();
  
  try {
    const files = await fs.readdir(config.storage.dataDir);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch {
    return [];
  }
}

/**
 * Checks if data directory is writable
 * @returns {Promise<boolean>} True if writable
 */
async function checkWritePermissions() {
  await ensureDataDirectory();
  
  try {
    await fs.access(config.storage.dataDir, fsSync.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  ensureDataDirectory,
  accountExists,
  saveAccount,
  loadAccount,
  deleteAccount,
  listApiKeys,
  checkWritePermissions,
};
