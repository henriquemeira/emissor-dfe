const xmlBuilder = require('./xml-builder.service');
const signatureService = require('./signature.service');
const soapClient = require('./soap-client.service');
const storageService = require('../../../storage.service');
const cryptoService = require('../../../crypto.service');
const zlib = require('zlib');
const { debuglog } = require('util');

/**
 * Main service for São Paulo NFS-e operations (v01-1)
 * Orchestrates the complete flow from JSON to SOAP transmission
 */

const SUPPORTED_LAYOUT_VERSION = 'v01-1';

function buildSoapPayload(soap) {
  const requestBuffer = zlib.gzipSync(soap.request, { level: 9 });
  const responseBuffer = zlib.gzipSync(soap.response, { level: 9 });

  return {
    compression: 'gzip',
    encoding: 'base64',
    request: requestBuffer.toString('base64'),
    response: responseBuffer.toString('base64'),
    sizes: {
      requestBytes: Buffer.byteLength(soap.request, 'utf8'),
      responseBytes: Buffer.byteLength(soap.response, 'utf8'),
      requestCompressedBytes: requestBuffer.length,
      responseCompressedBytes: responseBuffer.length,
    },
  };
}

function ensureConsultaSituacaoLoteNamespaces(xml) {
  let normalized = xml;

  if (!normalized.includes('<CPFCNPJRemetente xmlns="">')) {
    normalized = normalized.replace(
      '<CPFCNPJRemetente>',
      '<CPFCNPJRemetente xmlns="">'
    );
  }

  if (!normalized.includes('<NumeroProtocolo xmlns="">')) {
    normalized = normalized.replace(
      '<NumeroProtocolo>',
      '<NumeroProtocolo xmlns="">'
    );
  }

  return normalized;
}

/**
 * Sends a batch of RPS for emission
 * @param {Object} data - Request data
 * @param {string} data.layoutVersion - Layout version (must be 'v01-1')
 * @param {Object} data.lote - Batch data containing header and RPS list
 * @param {string} apiKey - API key for certificate retrieval
 * @param {boolean} isTest - Whether to use test mode
 * @returns {Object} Response from web service
 */
async function enviarLoteRps(data, apiKey, isTest = false) {
  try {
    // Validate layout version
    if (data.layoutVersion !== SUPPORTED_LAYOUT_VERSION) {
      throw new Error(`Layout não suportado. Versão esperada: ${SUPPORTED_LAYOUT_VERSION}`);
    }
    
    // Validate required fields
    validateLoteData(data.lote);
    
    // Get certificate from storage
    const account = await storageService.loadAccount(apiKey);
    if (!account || !account.certificado) {
      throw new Error('Certificado não encontrado para esta API Key');
    }
    
    // Decrypt certificate
    const certificateBuffer = cryptoService.decryptFile(account.certificado);
    const certificatePassword = cryptoService.decrypt(account.senha);
    
    // Sign each RPS
    const rpsWithSignatures = await signAllRPS(
      data.lote.rps,
      certificateBuffer,
      certificatePassword
    );
    
    // Update lote with signed RPS
    const loteData = {
      cabecalho: data.lote.cabecalho,
      rps: rpsWithSignatures,
    };
    
    // Build XML
    const xmlWithoutSignature = xmlBuilder.buildPedidoEnvioLoteRPS(loteData, '');
    
    // Sign the complete XML batch
    const batchSignature = signatureService.signXMLBatch(
      xmlWithoutSignature,
      certificateBuffer,
      certificatePassword
    );
    
    // Build final XML with signature
    const signedXml = xmlBuilder.buildPedidoEnvioLoteRPS(loteData, batchSignature);
    
    // Log the signed XML for debugging
    debuglog('=== XML Assinado ===');
    debuglog(signedXml);
    debuglog('=== Tamanho total do XML:', signedXml.length, 'bytes ===');
    
    // Determine environment
    const isProduction = !isTest;
    
    // Send to web service with certificate for mTLS authentication
    const soapResult = await soapClient.envioLoteRpsAsync(
      signedXml, 
      1, 
      isProduction,
      certificateBuffer,
      certificatePassword
    );

    const soapPayload = data.includeSoap
      ? buildSoapPayload(soapResult.soap)
      : undefined;
    
    return {
      success: true,
      layoutVersion: data.layoutVersion,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao enviar lote de RPS: ${error.message}`);
  }
}

/**
 * Tests batch sending (test mode)
 * @param {Object} data - Request data
 * @param {string} apiKey - API key for certificate retrieval
 * @returns {Object} Response from web service
 */
async function testarEnvioLoteRps(data, apiKey) {
  try {
    // Validate layout version
    if (data.layoutVersion !== SUPPORTED_LAYOUT_VERSION) {
      throw new Error(`Layout não suportado. Versão esperada: ${SUPPORTED_LAYOUT_VERSION}`);
    }
    
    // Validate required fields
    validateLoteData(data.lote);
    
    // Get certificate from storage
    const account = await storageService.loadAccount(apiKey);
    if (!account || !account.certificado) {
      throw new Error('Certificado não encontrado para esta API Key');
    }
    
    // Decrypt certificate
    const certificateBuffer = cryptoService.decryptFile(account.certificado);
    const certificatePassword = cryptoService.decrypt(account.senha);
    
    // Sign each RPS
    const rpsWithSignatures = await signAllRPS(
      data.lote.rps,
      certificateBuffer,
      certificatePassword
    );
    
    // Update lote with signed RPS
    const loteData = {
      cabecalho: data.lote.cabecalho,
      rps: rpsWithSignatures,
    };
    
    // Build XML
    const xmlWithoutSignature = xmlBuilder.buildPedidoEnvioLoteRPS(loteData, '');
    
    // Sign the complete XML batch
    const batchSignature = signatureService.signXMLBatch(
      xmlWithoutSignature,
      certificateBuffer,
      certificatePassword
    );
    
    // Build final XML with signature
    const signedXml = xmlBuilder.buildPedidoEnvioLoteRPS(loteData, batchSignature);
    
    // Log the signed XML for debugging
    debuglog('=== XML Assinado ===');
    debuglog(signedXml);
    debuglog('=== Tamanho total do XML:', signedXml.length, 'bytes ===');
    
    // Send to test web service with certificate for mTLS authentication
    const soapResult = await soapClient.testeEnvioLoteRpsAsync(
      signedXml, 
      1, 
      false,
      certificateBuffer,
      certificatePassword
    );

    const soapPayload = data.includeSoap
      ? buildSoapPayload(soapResult.soap)
      : undefined;
    
    return {
      success: true,
      layoutVersion: data.layoutVersion,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao testar envio de lote de RPS: ${error.message}`);
  }
}

/**
 * Signs all RPS in the batch
 * @param {Array} rpsList - List of RPS to sign
 * @param {Buffer} certificateBuffer - Certificate buffer
 * @param {string} certificatePassword - Certificate password
 * @returns {Array} RPS list with signatures
 */
async function signAllRPS(rpsList, certificateBuffer, certificatePassword) {
  const signedRpsList = [];
  
  for (const rps of rpsList) {
    // Sign the RPS
    const assinatura = signatureService.signRPS(rps, certificateBuffer, certificatePassword);
    
    // Add signature to RPS
    signedRpsList.push({
      ...rps,
      assinatura,
    });
  }
  
  return signedRpsList;
}

/**
 * Validates batch data
 * @param {Object} lote - Batch data
 * @throws {Error} If validation fails
 */
function validateLoteData(lote) {
  if (!lote) {
    throw new Error('Dados do lote são obrigatórios');
  }
  
  // Validate header
  if (!lote.cabecalho) {
    throw new Error('Cabeçalho do lote é obrigatório');
  }
  
  const { cabecalho } = lote;
  
  if (!cabecalho.cpfCnpjRemetente) {
    throw new Error('CPF/CNPJ do remetente é obrigatório');
  }
  
  if (!cabecalho.cpfCnpjRemetente.cnpj && !cabecalho.cpfCnpjRemetente.cpf) {
    throw new Error('Informe CPF ou CNPJ do remetente');
  }
  
  if (!cabecalho.dtInicio) {
    throw new Error('Data de início é obrigatória');
  }
  
  if (!cabecalho.dtFim) {
    throw new Error('Data de fim é obrigatória');
  }
  
  if (!cabecalho.qtdRPS) {
    throw new Error('Quantidade de RPS é obrigatória');
  }
  
  if (cabecalho.valorTotalServicos === undefined || cabecalho.valorTotalServicos === null) {
    throw new Error('Valor total de serviços é obrigatório');
  }
  
  // Validate RPS list
  if (!lote.rps || !Array.isArray(lote.rps) || lote.rps.length === 0) {
    throw new Error('Lista de RPS é obrigatória e deve conter ao menos um RPS');
  }
  
  // Validate quantity matches
  if (lote.rps.length !== cabecalho.qtdRPS) {
    throw new Error(`Quantidade de RPS informada (${cabecalho.qtdRPS}) não corresponde à quantidade enviada (${lote.rps.length})`);
  }
  
  // Validate each RPS
  lote.rps.forEach((rps, index) => {
    validateRPS(rps, index);
  });
}

/**
 * Validates individual RPS
 * @param {Object} rps - RPS data
 * @param {number} index - RPS index in batch
 * @throws {Error} If validation fails
 */
function validateRPS(rps, index) {
  const rpsNum = index + 1;
  
  if (!rps.chaveRPS) {
    throw new Error(`RPS ${rpsNum}: Chave do RPS é obrigatória`);
  }
  
  if (!rps.chaveRPS.inscricaoPrestador) {
    throw new Error(`RPS ${rpsNum}: Inscrição do prestador é obrigatória`);
  }
  
  if (!rps.chaveRPS.serieRPS) {
    throw new Error(`RPS ${rpsNum}: Série do RPS é obrigatória`);
  }
  
  if (!rps.chaveRPS.numeroRPS) {
    throw new Error(`RPS ${rpsNum}: Número do RPS é obrigatório`);
  }
  
  if (!rps.tipoRPS) {
    throw new Error(`RPS ${rpsNum}: Tipo do RPS é obrigatório`);
  }
  
  if (!rps.dataEmissao) {
    throw new Error(`RPS ${rpsNum}: Data de emissão é obrigatória`);
  }
  
  if (!rps.statusRPS) {
    throw new Error(`RPS ${rpsNum}: Status do RPS é obrigatório`);
  }
  
  if (!rps.tributacaoRPS) {
    throw new Error(`RPS ${rpsNum}: Tributação do RPS é obrigatória`);
  }
  
  if (rps.valorServicos === undefined || rps.valorServicos === null) {
    throw new Error(`RPS ${rpsNum}: Valor de serviços é obrigatório`);
  }
  
  if (rps.valorDeducoes === undefined || rps.valorDeducoes === null) {
    throw new Error(`RPS ${rpsNum}: Valor de deduções é obrigatório`);
  }
  
  if (!rps.codigoServico) {
    throw new Error(`RPS ${rpsNum}: Código do serviço é obrigatório`);
  }
  
  if (rps.aliquotaServicos === undefined || rps.aliquotaServicos === null) {
    throw new Error(`RPS ${rpsNum}: Alíquota de serviços é obrigatória`);
  }
  
  if (rps.issRetido === undefined || rps.issRetido === null) {
    throw new Error(`RPS ${rpsNum}: ISS Retido é obrigatório`);
  }
  
  if (!rps.discriminacao) {
    throw new Error(`RPS ${rpsNum}: Discriminação dos serviços é obrigatória`);
  }
}

/**
 * Consults batch status using protocol number
 * @param {Object} data - Request data
 * @param {string} data.layoutVersion - Layout version (must be 'v01-1')
 * @param {Object} data.cpfCnpjRemetente - CPF/CNPJ of sender
 * @param {string} data.numeroProtocolo - Protocol number from batch submission
 * @param {string} apiKey - API key for certificate retrieval
 * @param {boolean} isTest - Whether to use test mode
 * @returns {Object} Response from web service
 */
async function consultarSituacaoLote(data, apiKey, isTest = false) {
  try {
    // Validate layout version
    if (data.layoutVersion !== SUPPORTED_LAYOUT_VERSION) {
      throw new Error(`Layout não suportado. Versão esperada: ${SUPPORTED_LAYOUT_VERSION}`);
    }
    
    // Validate required fields
    if (!data.cpfCnpjRemetente) {
      throw new Error('CPF/CNPJ do remetente é obrigatório');
    }
    
    if (!data.cpfCnpjRemetente.cnpj && !data.cpfCnpjRemetente.cpf) {
      throw new Error('Informe CPF ou CNPJ do remetente');
    }
    
    if (!data.numeroProtocolo) {
      throw new Error('Número do protocolo é obrigatório');
    }
    
    // Get certificate from storage
    const account = await storageService.loadAccount(apiKey);
    if (!account || !account.certificado) {
      throw new Error('Certificado não encontrado para esta API Key');
    }
    
    // Decrypt certificate
    const certificateBuffer = cryptoService.decryptFile(account.certificado);
    const certificatePassword = cryptoService.decrypt(account.senha);
    
    // Build XML for consultation
    const consultaXml = ensureConsultaSituacaoLoteNamespaces(xmlBuilder.buildPedidoConsultaSituacaoLote({
      cpfCnpjRemetente: data.cpfCnpjRemetente,
      numeroProtocolo: data.numeroProtocolo,
    }));
    
    // Determine environment
    const isProduction = !isTest;
    
    // Send to web service with certificate for mTLS authentication
    const soapResult = await soapClient.consultaSituacaoLote(
      consultaXml,
      1,
      isProduction,
      certificateBuffer,
      certificatePassword
    );

    const soapPayload = data.includeSoap
      ? buildSoapPayload(soapResult.soap)
      : undefined;
    
    return {
      success: true,
      layoutVersion: data.layoutVersion,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao consultar situação do lote: ${error.message}`);
  }
}

/**
 * Sends a single RPS synchronously
 * @param {Object} data - Request data
 * @param {string} data.layoutVersion - Layout version (must be 'v01-1')
 * @param {Object} data.lote - Batch data containing header and single RPS
 * @param {string} apiKey - API key for certificate retrieval
 * @param {boolean} isTest - Whether to use test mode
 * @returns {Object} Response from web service with immediate processing result
 */
async function enviarRpsSincrono(data, apiKey, isTest = false) {
  try {
    // Validate layout version
    if (data.layoutVersion !== SUPPORTED_LAYOUT_VERSION) {
      throw new Error(`Layout não suportado. Versão esperada: ${SUPPORTED_LAYOUT_VERSION}`);
    }
    
    // Validate required fields
    validateLoteData(data.lote);
    
    // Get certificate from storage
    const account = await storageService.loadAccount(apiKey);
    if (!account || !account.certificado) {
      throw new Error('Certificado não encontrado para esta API Key');
    }
    
    // Decrypt certificate
    const certificateBuffer = cryptoService.decryptFile(account.certificado);
    const certificatePassword = cryptoService.decrypt(account.senha);
    
    // Get the single RPS (already validated to have only one)
    const rps = data.lote.rps[0];
    
    // Sign the RPS
    const assinatura = signatureService.signRPS(rps, certificateBuffer, certificatePassword);
    
    // Add signature to RPS
    const rpsWithSignature = {
      ...rps,
      assinatura,
    };
    
    // Build XML for single RPS
    const xmlWithoutSignature = xmlBuilder.buildPedidoEnvioRPS(
      {
        cpfCnpjRemetente: data.lote.cabecalho.cpfCnpjRemetente,
        rps: rpsWithSignature,
      },
      ''
    );
    
    // Sign the complete XML
    const batchSignature = signatureService.signXMLBatch(
      xmlWithoutSignature,
      certificateBuffer,
      certificatePassword
    );
    
    // Build final XML with signature
    const signedXml = xmlBuilder.buildPedidoEnvioRPS(
      {
        cpfCnpjRemetente: data.lote.cabecalho.cpfCnpjRemetente,
        rps: rpsWithSignature,
      },
      batchSignature
    );
    
    // Log the signed XML for debugging
    debuglog('=== XML Assinado (Síncrono) ===');
    debuglog(signedXml);
    debuglog('=== Tamanho total do XML:', signedXml.length, 'bytes ===');
    
    // Determine environment
    const isProduction = !isTest;
    
    // Send to web service with certificate for mTLS authentication
    const soapResult = await soapClient.envioRps(
      signedXml, 
      1, 
      isProduction,
      certificateBuffer,
      certificatePassword
    );

    const soapPayload = data.includeSoap
      ? buildSoapPayload(soapResult.soap)
      : undefined;
    
    return {
      success: true,
      layoutVersion: data.layoutVersion,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao enviar RPS síncrono: ${error.message}`);
  }
}

module.exports = {
  enviarLoteRps,
  testarEnvioLoteRps,
  consultarSituacaoLote,
  enviarRpsSincrono,
  SUPPORTED_LAYOUT_VERSION,
};
