/**
 * NFS-e Service - São Paulo Municipality
 * Business logic for NFS-e operations
 * 
 * Phase 2 - EnvioLoteRPSAsync (v01-1)
 */

const storageService = require('./storage.service');
const cryptoService = require('./crypto.service');
const XmlBuilder = require('../utils/xmlBuilder');
const SoapClient = require('../utils/soapClient');

const nfseService = {
  /**
   * Emitir lote de RPS (Async)
   * @param {Object} data - RPS batch data with version
   * @param {string} apiKey - API Key for authentication
   * @returns {Promise<Object>} Emission result
   */
  async enviarLoteRpsAsync(data, apiKey) {
    try {
      // Validate version
      if (!data.versao) {
        throw new Error('Campo versao é obrigatório');
      }
      
      if (data.versao !== 'v01-1') {
        throw new Error('layout não suportado');
      }

      // Load account with certificate
      const account = await storageService.loadAccount(apiKey);
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      // Decrypt certificate and password
      const certificateBuffer = cryptoService.decryptFile(account.certificado);
      const certificatePassword = cryptoService.decrypt(account.senha);
      
      // Get CNPJ from metadata
      const cnpj = account.metadata.cnpj;
      
      // Build and sign XML
      const signedXml = XmlBuilder.buildPedidoEnvioLoteRPS(
        data,
        cnpj,
        certificateBuffer,
        certificatePassword
      );

      // Send to SOAP web service
      const soapClient = new SoapClient();
      const response = await soapClient.envioLoteRPS(signedXml, 1); // versaoSchema = 1 for v01-1

      // Process response
      if (!response.success) {
        return {
          sucesso: false,
          erro: response.error,
          xmlEnviado: signedXml
        };
      }

      const { parsed, rawXml } = response;

      return {
        sucesso: parsed.sucesso,
        protocolo: parsed.protocolo,
        dataRecebimento: parsed.dataRecebimento,
        erros: parsed.erros,
        alertas: parsed.alertas,
        xmlEnviado: signedXml,
        xmlRetorno: rawXml
      };

    } catch (error) {
      // Handle specific errors
      if (error.message === 'layout não suportado') {
        throw error;
      }
      
      throw new Error(`Erro ao enviar lote de RPS: ${error.message}`);
    }
  },

  /**
   * Test RPS batch (validation only)
   * @param {Object} data - RPS batch data
   * @param {string} apiKey - API Key
   * @returns {Promise<Object>} Validation result
   */
  async testeEnvioLoteRps(data, apiKey) {
    try {
      // Validate version
      if (!data.versao || data.versao !== 'v01-1') {
        throw new Error('layout não suportado');
      }

      // Load account
      const account = await storageService.loadAccount(apiKey);
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      // Decrypt certificate
      const certificateBuffer = cryptoService.decryptFile(account.certificado);
      const certificatePassword = cryptoService.decrypt(account.senha);
      const cnpj = account.metadata.cnpj;

      // Build XML
      const signedXml = XmlBuilder.buildPedidoEnvioLoteRPS(
        data,
        cnpj,
        certificateBuffer,
        certificatePassword
      );

      // Test with web service
      const soapClient = new SoapClient();
      const response = await soapClient.testeEnvioLoteRPS(signedXml, 1);

      return {
        sucesso: response.success,
        resultado: response.parsed || response.error,
        xmlGerado: signedXml
      };

    } catch (error) {
      throw new Error(`Erro ao testar lote de RPS: ${error.message}`);
    }
  }
};

module.exports = nfseService;
