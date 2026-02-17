const { config } = require('../config/env');

/**
 * Error handler middleware
 * Catches all errors and returns standardized JSON response
 */
function errorHandler(err, req, res, next) {
  // Log error (in production, use proper logging service)
  if (config.server.nodeEnv !== 'production') {
    console.error('Error:', err);
  }
  
  // Handle known error codes
  const errorMap = {
    'INVALID_CERTIFICATE': { status: 400, message: 'Certificado inválido ou corrompido' },
    'CERTIFICATE_EXPIRED': { status: 400, message: 'Certificado expirado' },
    'INVALID_PASSWORD': { status: 400, message: 'Senha do certificado incorreta' },
    'INVALID_API_KEY': { status: 401, message: 'API Key inválida ou não encontrada' },
    'ACCOUNT_NOT_FOUND': { status: 404, message: 'Conta não encontrada' },
    'ACCOUNT_ALREADY_EXISTS': { status: 409, message: 'Já existe uma conta com este certificado' },
    'MISSING_REQUIRED_FIELD': { status: 400, message: 'Campo obrigatório ausente' },
    'VALIDATION_ERROR': { status: 400, message: 'Erro de validação' },
    'RATE_LIMIT_EXCEEDED': { status: 429, message: 'Limite de requisições excedido' },
  };
  
  // Check if error message matches a known code
  let errorCode = 'INTERNAL_ERROR';
  let statusCode = 500;
  let errorMessage = 'Erro interno do servidor';
  
  if (err.message && errorMap[err.message]) {
    errorCode = err.message;
    statusCode = errorMap[errorCode].status;
    errorMessage = errorMap[errorCode].message;
  } else if (err.message && err.message.startsWith('INVALID_CERTIFICATE:')) {
    errorCode = 'INVALID_CERTIFICATE';
    statusCode = 400;
    errorMessage = err.message.replace('INVALID_CERTIFICATE:', '').trim();
  }
  
  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };
  
  // Add details in development mode
  if (config.server.nodeEnv !== 'production' && err.stack) {
    errorResponse.error.details = {
      stack: err.stack,
      originalMessage: err.message,
    };
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unknown routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Rota não encontrada',
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
