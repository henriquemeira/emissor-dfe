/**
 * NFS-e Controller - São Paulo Municipality
 * Handles HTTP requests for NFS-e operations
 * 
 * Phase 2 - EnvioLoteRPSAsync (v01-1)
 */

const nfseService = require('../services/nfse.service');

const nfseController = {
  /**
   * POST /api/v1/nfse/emitir
   * Emitir lote de RPS assíncrono
   */
  async emitir(req, res, next) {
    try {
      const { apiKey } = req;
      const data = req.body;

      // Validate required fields
      if (!data.versao) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Campo versao é obrigatório'
          }
        });
      }

      if (!data.cabecalho) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Campo cabecalho é obrigatório'
          }
        });
      }

      if (!data.rps || !Array.isArray(data.rps) || data.rps.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Campo rps é obrigatório e deve conter ao menos um RPS'
          }
        });
      }

      // Validate cabecalho fields
      const { cabecalho } = data;
      if (!cabecalho.dtInicio || !cabecalho.dtFim) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Campos dtInicio e dtFim são obrigatórios no cabecalho'
          }
        });
      }

      // Call service
      const result = await nfseService.enviarLoteRpsAsync(data, apiKey);

      if (!result.sucesso) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao processar lote de RPS',
          data: {
            erros: result.erros,
            alertas: result.alertas,
            xmlEnviado: result.xmlEnviado,
            xmlRetorno: result.xmlRetorno
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lote de RPS enviado com sucesso',
        data: {
          protocolo: result.protocolo,
          dataRecebimento: result.dataRecebimento,
          erros: result.erros,
          alertas: result.alertas,
          xmlEnviado: result.xmlEnviado,
          xmlRetorno: result.xmlRetorno
        }
      });

    } catch (error) {
      // Handle version error specifically
      if (error.message === 'layout não suportado') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_VERSION',
            message: 'layout não suportado'
          }
        });
      }

      next(error);
    }
  },

  /**
   * POST /api/v1/nfse/teste
   * Test RPS batch (validation only)
   */
  async teste(req, res, next) {
    try {
      const { apiKey } = req;
      const data = req.body;

      // Validate version
      if (!data.versao) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Campo versao é obrigatório'
          }
        });
      }

      // Call test service
      const result = await nfseService.testeEnvioLoteRps(data, apiKey);

      return res.status(200).json({
        success: true,
        message: 'Teste de lote de RPS realizado',
        data: result
      });

    } catch (error) {
      if (error.message === 'layout não suportado') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_VERSION',
            message: 'layout não suportado'
          }
        });
      }

      next(error);
    }
  }
};

module.exports = nfseController;
