const nfseSpService = require('../services/nfse/sp/sao-paulo/nfse-sp.service');

/**
 * Controller for São Paulo NFS-e operations
 */

/**
 * Sends a batch of RPS for emission (EnvioLoteRpsAsync)
 * POST /api/v1/nfse/sp/sao-paulo/envio-lote-rps
 */
async function enviarLoteRps(req, res, next) {
  try {
    const { layoutVersion, lote } = req.body;
    const apiKey = req.apiKey; // From authentication middleware
    const isTest = req.body.ambiente === 'teste' || req.body.ambiente === 'test';
    
    // Validate layout version
    if (!layoutVersion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_LAYOUT_VERSION',
          message: 'Campo layoutVersion é obrigatório',
        },
      });
    }
    
    if (layoutVersion !== nfseSpService.SUPPORTED_LAYOUT_VERSION) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_LAYOUT',
          message: `Layout não suportado. Versão esperada: ${nfseSpService.SUPPORTED_LAYOUT_VERSION}`,
        },
      });
    }
    
    // Validate lote
    if (!lote) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_LOTE',
          message: 'Campo lote é obrigatório',
        },
      });
    }
    
    // Call service
    const result = await nfseSpService.enviarLoteRps(
      { layoutVersion, lote },
      apiKey,
      isTest
    );
    
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Pass to error handler middleware
    next(error);
  }
}

/**
 * Tests batch sending (TesteEnvioLoteRpsAsync)
 * POST /api/v1/nfse/sp/sao-paulo/teste-envio-lote-rps
 */
async function testarEnvioLoteRps(req, res, next) {
  try {
    const { layoutVersion, lote } = req.body;
    const apiKey = req.apiKey; // From authentication middleware
    
    // Validate layout version
    if (!layoutVersion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_LAYOUT_VERSION',
          message: 'Campo layoutVersion é obrigatório',
        },
      });
    }
    
    if (layoutVersion !== nfseSpService.SUPPORTED_LAYOUT_VERSION) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_LAYOUT',
          message: `Layout não suportado. Versão esperada: ${nfseSpService.SUPPORTED_LAYOUT_VERSION}`,
        },
      });
    }
    
    // Validate lote
    if (!lote) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_LOTE',
          message: 'Campo lote é obrigatório',
        },
      });
    }
    
    // Call service
    const result = await nfseSpService.testarEnvioLoteRps(
      { layoutVersion, lote },
      apiKey
    );
    
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Pass to error handler middleware
    next(error);
  }
}

module.exports = {
  enviarLoteRps,
  testarEnvioLoteRps,
};
