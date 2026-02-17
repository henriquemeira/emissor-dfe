const { isValidApiKey } = require('../utils/apiKey');
const storageService = require('../services/storage.service');

/**
 * Middleware to authenticate requests using API Key
 */
async function authenticateApiKey(req, res, next) {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API Key não fornecida. Use o header X-API-Key',
        },
      });
    }
    
    // Validate API key format
    if (!isValidApiKey(apiKey)) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Formato de API Key inválido',
        },
      });
    }
    
    // Check if account exists
    const exists = await storageService.accountExists(apiKey);
    if (!exists) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API Key inválida ou não encontrada',
        },
      });
    }
    
    // Store API key in request for later use
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticateApiKey };
