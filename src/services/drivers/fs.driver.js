const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { config } = require('../../config/env');

async function ensureDataDirectory() {
  try {
    await fs.access(config.storage.dataDir);
  } catch {
    await fs.mkdir(config.storage.dataDir, { recursive: true });
  }
}

function getFilePath(apiKey) {
  return path.join(config.storage.dataDir, `${apiKey}.json`);
}

async function accountExists(apiKey) {
  try {
    await fs.access(getFilePath(apiKey));
    return true;
  } catch {
    return false;
  }
}

async function saveAccount(apiKey, data) {
  await ensureDataDirectory();
  const filePath = getFilePath(apiKey);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

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
