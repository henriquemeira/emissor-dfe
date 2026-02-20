const { put, del, list, head, get } = require('@vercel/blob');
const { config } = require('../../config/env');

function getBlobKey(apiKey) {
  return `${config.storage.blobPrefix}${apiKey}.json`;
}

async function ensureDataDirectory() {
  // No-op for Blob storage
}

async function accountExists(apiKey) {
  try {
    await head(getBlobKey(apiKey), { token: config.storage.blobToken });
    return true;
  } catch {
    return false;
  }
}

async function saveAccount(apiKey, data) {
  const content = JSON.stringify(data, null, 2);
  await put(getBlobKey(apiKey), content, {
    access: 'public',
    contentType: 'application/json',
    token: config.storage.blobToken,
    addRandomSuffix: false,
  });
}

async function loadAccount(apiKey) {
  const result = await get(getBlobKey(apiKey), {
    access: 'public',
    token: config.storage.blobToken,
  });

  if (!result || result.statusCode === 304) {
    throw new Error('ACCOUNT_NOT_FOUND');
  }

  const chunks = [];
  const reader = result.stream.getReader();
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (value) chunks.push(value);
    done = d;
  }
  const text = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
  return JSON.parse(text);
}

async function deleteAccount(apiKey) {
  let blobMeta;
  try {
    blobMeta = await head(getBlobKey(apiKey), { token: config.storage.blobToken });
  } catch {
    throw new Error('ACCOUNT_NOT_FOUND');
  }
  await del(blobMeta.url, { token: config.storage.blobToken });
}

async function listApiKeys() {
  const keys = [];
  let cursor;

  do {
    const result = await list({
      prefix: config.storage.blobPrefix,
      token: config.storage.blobToken,
      cursor,
    });
    for (const blob of result.blobs) {
      const name = blob.pathname.slice(config.storage.blobPrefix.length);
      if (name.endsWith('.json')) {
        keys.push(name.slice(0, -5));
      }
    }
    cursor = result.cursor;
  } while (cursor);

  return keys;
}

async function checkWritePermissions() {
  const testKey = `${config.storage.blobPrefix}.write-check.tmp`;
  try {
    const blob = await put(testKey, 'ok', {
      access: 'public',
      contentType: 'text/plain',
      token: config.storage.blobToken,
      addRandomSuffix: false,
    });
    await del(blob.url, { token: config.storage.blobToken });
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
