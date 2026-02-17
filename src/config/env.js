require('dotenv').config();

const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3000'],
  },
  storage: {
    dataDir: process.env.DATA_DIR || './data',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
};

// Validate required environment variables
function validateConfig() {
  if (!config.security.encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (config.security.encryptionKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  if (config.server.nodeEnv === 'production') {
    const defaultKey = 'change-this-to-a-secure-random-key-with-at-least-32-characters';
    if (config.security.encryptionKey === defaultKey) {
      throw new Error('Please change ENCRYPTION_KEY to a secure random value in production');
    }
  }
}

module.exports = { config, validateConfig };
