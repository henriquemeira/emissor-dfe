const nfseSpService = require('../services/nfse/sp/sao-paulo/nfse-sp.service');

/**
 * Controller for São Paulo NFS-e operations
 */

/**
 * Sends a batch of RPS for emission (EnvioLoteRpsAsync or EnvioRPS)
 * Supports both synchronous and asynchronous methods
 * POST /api/v1/nfse/sp/sao-paulo/envio-lote-rps
 */
async function enviarLoteRps(req, res, next) {
  try {
    const { layoutVersion, lote, metodo } = req.body;
    const apiKey = req.apiKey; // From authentication middleware
    const isTest = req.body.ambiente === 'teste' || req.body.ambiente === 'test';
    const includeSoap = req.query.includeSoap !== 'false' && req.body.includeSoap !== false;
    
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
    
    // Validate metodo parameter
    const metodoValue = metodo ? metodo.toLowerCase() : 'assincrono';
    if (metodoValue !== 'sincrono' && metodoValue !== 'assincrono') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_METODO',
          message: 'Campo metodo deve ser "sincrono" ou "assincrono"',
        },
      });
    }
    
    // If synchronous method, validate that only 1 RPS is being sent
    if (metodoValue === 'sincrono') {
      if (!lote.rps || !Array.isArray(lote.rps)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_RPS',
            message: 'Lista de RPS é obrigatória',
          },
        });
      }
      
      if (lote.rps.length !== 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RPS_COUNT_SYNC',
            message: 'Método síncrono aceita apenas um único RPS. Para envio de múltiplos RPS, utilize o método assíncrono.',
          },
        });
      }
    }
    
    // Call appropriate service method based on metodo
    let result;
    if (metodoValue === 'sincrono') {
      result = await nfseSpService.enviarRpsSincrono(
        { layoutVersion, lote, includeSoap },
        apiKey,
        isTest
      );
    } else {
      result = await nfseSpService.enviarLoteRps(
        { layoutVersion, lote, includeSoap },
        apiKey,
        isTest
      );
    }
    
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
    const includeSoap = req.query.includeSoap === 'true' || req.body.includeSoap === true;
    
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
      { layoutVersion, lote, includeSoap },
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

/**
 * Consults batch status using protocol number (ConsultaSituacaoLote)
 * POST /api/v1/nfse/sp/sao-paulo/consulta-situacao-lote
 */
async function consultarSituacaoLote(req, res, next) {
  try {
    const { layoutVersion, cpfCnpjRemetente, numeroProtocolo } = req.body;
    const apiKey = req.apiKey; // From authentication middleware
    const isTest = req.body.ambiente === 'teste' || req.body.ambiente === 'test';
    const includeSoap = req.query.includeSoap !== 'false' && req.body.includeSoap !== false;
    
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
    
    // Validate cpfCnpjRemetente
    if (!cpfCnpjRemetente) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_CPF_CNPJ',
          message: 'Campo cpfCnpjRemetente é obrigatório',
        },
      });
    }
    
    // Validate numeroProtocolo
    if (!numeroProtocolo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PROTOCOL',
          message: 'Campo numeroProtocolo é obrigatório',
        },
      });
    }
    
    // Call service
    const result = await nfseSpService.consultarSituacaoLote(
      { layoutVersion, cpfCnpjRemetente, numeroProtocolo, includeSoap },
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

module.exports = {
  enviarLoteRps,
  testarEnvioLoteRps,
  consultarSituacaoLote,
};
