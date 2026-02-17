const { validateRequiredFields } = require('../utils/validators');

/**
 * Middleware factory to validate required fields in request body
 * @param {string[]} requiredFields - Array of required field names
 */
function validateRequest(requiredFields) {
  return (req, res, next) => {
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: validation.error,
          details: {
            missing: validation.missing,
          },
        },
      });
    }
    
    next();
  };
}

module.exports = { validateRequest };
