const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { config, validateConfig } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const storageService = require('./services/storage.service');

// Import routes
const accountRoutes = require('./routes/account.routes');
const nfeRoutes = require('./routes/nfe.routes');
const nfseRoutes = require('./routes/nfse.routes');
const nfseSpRoutes = require('./routes/nfse-sp.routes');
const cteRoutes = require('./routes/cte.routes');
const mdfeRoutes = require('./routes/mdfe.routes');

// Validate configuration on startup
try {
  validateConfig();
  console.log('✓ Configuration validated successfully');
} catch (error) {
  console.error('✗ Configuration error:', error.message);
  process.exit(1);
}

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.security.allowedOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Limite de requisições excedido. Tente novamente mais tarde.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint (no rate limiting)
app.get('/health', async (req, res) => {
  try {
    // Check if data directory is writable
    const canWrite = await storageService.checkWritePermissions();
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      storage: {
        writable: canWrite,
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/nfe', nfeRoutes);
app.use('/api/v1/nfse', nfseRoutes);
app.use('/api/v1/nfse/sp/sao-paulo', nfseSpRoutes);
app.use('/api/v1/cte', cteRoutes);
app.use('/api/v1/mdfe', mdfeRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;

async function startServer() {
  try {
    // Ensure data directory exists
    await storageService.ensureDataDirectory();
    console.log('✓ Data directory ready');
    
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('  Emissor DFe API - Servidor iniciado com sucesso!');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`  Ambiente:     ${config.server.nodeEnv}`);
      console.log(`  Porta:        ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/health`);
      console.log(`  API Base:     http://localhost:${PORT}/api/v1`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
