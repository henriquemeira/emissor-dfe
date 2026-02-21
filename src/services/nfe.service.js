/**
 * NF-e Service
 * Orchestrates the complete NF-e emission flow:
 *   JSON input → XML build → digital signature → SEFAZ transmission
 *
 * Reuses the certificate setup already implemented for other document types.
 */

const chaveAcessoService = require('./nfe/chave-acesso.service');
const xmlBuilder = require('./nfe/xml-builder.service');
const signatureService = require('./nfe/signature.service');
const soapClient = require('./nfe/soap-client.service');
const storageService = require('./storage.service');
const cryptoService = require('./crypto.service');
const zlib = require('zlib');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compresses SOAP envelope pair for optional debug output
 */
function buildSoapPayload(soap) {
  const requestBuffer  = zlib.gzipSync(soap.request,  { level: 9 });
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

/**
 * Loads and decrypts the account certificate
 * @param {string} apiKey
 * @returns {Promise<{ certificateBuffer: Buffer, certificatePassword: string }>}
 */
async function loadCertificate(apiKey) {
  const account = await storageService.loadAccount(apiKey);
  if (!account || !account.certificado) {
    throw new Error('Certificado não encontrado para esta API Key');
  }
  return {
    certificateBuffer: cryptoService.decryptFile(account.certificado),
    certificatePassword: cryptoService.decrypt(account.senha),
  };
}

// ---------------------------------------------------------------------------
// Public service methods
// ---------------------------------------------------------------------------

/**
 * Emits a NF-e by converting JSON to XML, signing and submitting to SEFAZ
 *
 * @param {Object} data - Request data
 * @param {string} data.ambiente - 'homologacao' | 'producao'
 * @param {Object} data.nfe - NF-e data object (see xml-builder.service.js)
 * @param {string|number} [data.idLote=1] - Lot identifier for enviNFe
 * @param {0|1} [data.indSinc=1] - 0=async, 1=sync (default sync)
 * @param {boolean} [data.includeSoap=false] - Include raw SOAP in response
 * @param {string} [data.endpointOverride] - Custom SEFAZ endpoint URL
 * @param {string} apiKey - API key
 * @returns {Promise<Object>} SEFAZ response
 */
async function emitir(data, apiKey) {
  try {
    const isProduction = data.ambiente === 'producao';
    const { certificateBuffer, certificatePassword } = await loadCertificate(apiKey);

    const nfe = data.nfe;
    if (!nfe || !nfe.ide || !nfe.emit) {
      throw new Error('Dados da NF-e incompletos: ide e emit são obrigatórios');
    }

    // Calculate access key (chave de acesso)
    const cnpjEmit = nfe.emit.CNPJ || nfe.emit.CPF || '';
    const { chaveAcesso, cNF, cDV } = chaveAcessoService.calcularChaveAcesso({
      cUF:    nfe.ide.cUF,
      dhEmi:  nfe.ide.dhEmi,
      cnpj:   cnpjEmit,
      mod:    nfe.ide.mod,
      serie:  nfe.ide.serie,
      nNF:    nfe.ide.nNF,
      tpEmis: nfe.ide.tpEmis,
      cNF:    nfe.ide.cNF,
    });

    // Inject calculated cNF and cDV into ide (user may have provided only some fields)
    nfe.ide.cNF = cNF;
    nfe.ide.cDV = cDV;

    // Force tpAmb to match requested environment
    nfe.ide.tpAmb = isProduction ? 1 : 2;

    // Build the NFe XML
    const nfeXml = xmlBuilder.buildNFe(nfe, chaveAcesso);

    // Sign the NFe XML – signature wraps infNFe by reference
    const signedNFeXml = signatureService.signXml(
      nfeXml,
      `#NFe${chaveAcesso}`,
      certificateBuffer,
      certificatePassword
    );

    // Build enviNFe wrapper
    const indSinc = data.indSinc !== undefined ? data.indSinc : 1;
    const idLote = data.idLote || 1;
    const enviNFeXml = xmlBuilder.buildEnviNFe(signedNFeXml, idLote, indSinc);

    // Submit to SEFAZ
    const cUF = nfe.ide.cUF;
    const soapResult = await soapClient.autorizacao(
      enviNFeXml,
      cUF,
      isProduction,
      certificateBuffer,
      certificatePassword,
      data.endpointOverride
    );

    const soapPayload = data.includeSoap ? buildSoapPayload(soapResult.soap) : undefined;

    return {
      success: true,
      chaveAcesso,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao emitir NF-e: ${error.message}`);
  }
}

/**
 * Queries a NF-e status by its 44-digit access key (NfeConsultaProtocolo4)
 *
 * @param {Object} data
 * @param {string} data.chNFe - 44-digit NF-e access key
 * @param {string} data.ambiente - 'homologacao' | 'producao'
 * @param {string|number} data.cUF - UF code (used for endpoint selection)
 * @param {boolean} [data.includeSoap=false]
 * @param {string} [data.endpointOverride]
 * @param {string} apiKey
 */
async function consultar(data, apiKey) {
  try {
    console.log('[NFe Consulta] Iniciando consulta de NF-e...');
    console.log('[NFe Consulta] Parâmetros recebidos:', {
      chNFe: data.chNFe,
      ambiente: data.ambiente,
      cUF: data.cUF,
      endpointOverride: data.endpointOverride,
    });

    if (!data.chNFe || data.chNFe.replace(/\D/g, '').length !== 44) {
      throw new Error('Chave de acesso (chNFe) deve ter 44 dígitos');
    }

    const isProduction = data.ambiente === 'producao';
    const { certificateBuffer, certificatePassword } = await loadCertificate(apiKey);
    const tpAmb = isProduction ? 1 : 2;

    console.log('[NFe Consulta] Ambiente:', isProduction ? 'PRODUÇÃO' : 'HOMOLOGAÇÃO');

    const consultaXml = xmlBuilder.buildConsSitNFe(data.chNFe, tpAmb);
    console.log('[NFe Consulta] XML de consulta gerado (primeiros 500 chars):', consultaXml.substring(0, 500));

    // Derive cUF from chNFe if not explicitly provided
    const cUF = data.cUF || parseInt(data.chNFe.substring(0, 2), 10);
    console.log('[NFe Consulta] Código UF determinado:', cUF);

    const soapResult = await soapClient.consultaProtocolo(
      consultaXml,
      cUF,
      isProduction,
      certificateBuffer,
      certificatePassword,
      data.endpointOverride
    );

    console.log('[NFe Consulta] Requisição SOAP concluída com sucesso');
    console.log('[NFe Consulta] Resultado parseado:', JSON.stringify(soapResult.parsed, null, 2));

    const soapPayload = data.includeSoap ? buildSoapPayload(soapResult.soap) : undefined;

    return {
      success: true,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    console.error('[NFe Consulta] Erro ao consultar NF-e:', error.message);
    console.error('[NFe Consulta] Stack trace:', error.stack);
    throw new Error(`Erro ao consultar NF-e: ${error.message}`);
  }
}

/**
 * Cancels an authorized NF-e by sending a cancellation event (tpEvento=110111)
 * to NFeRecepcaoEvento4.
 *
 * @param {Object} data
 * @param {string} data.chNFe - 44-digit NF-e access key
 * @param {string} data.nProt - Authorization protocol number
 * @param {string} data.xJust - Justification (15-255 chars)
 * @param {string} data.ambiente - 'homologacao' | 'producao'
 * @param {string} data.CNPJ - Emitter CNPJ (digits only)
 * @param {string} [data.dhEvento] - Event datetime; defaults to now
 * @param {number} [data.nSeqEvento=1]
 * @param {string|number} [data.cUF] - UF code; derived from chNFe if omitted
 * @param {boolean} [data.includeSoap=false]
 * @param {string} [data.endpointOverride]
 * @param {string} apiKey
 */
async function cancelar(data, apiKey) {
  try {
    if (!data.chNFe || data.chNFe.replace(/\D/g, '').length !== 44) {
      throw new Error('Chave de acesso (chNFe) deve ter 44 dígitos');
    }
    if (!data.nProt) throw new Error('Número do protocolo de autorização (nProt) é obrigatório');
    if (!data.xJust) throw new Error('Justificativa de cancelamento (xJust) é obrigatória');
    if (data.xJust.length < 15) throw new Error('Justificativa deve ter no mínimo 15 caracteres');
    if (!data.CNPJ)  throw new Error('CNPJ do emitente (CNPJ) é obrigatório');

    const isProduction = data.ambiente === 'producao';
    const { certificateBuffer, certificatePassword } = await loadCertificate(apiKey);

    const cUF = data.cUF || parseInt(data.chNFe.substring(0, 2), 10);
    const tpAmb = isProduction ? 1 : 2;
    const dhEvento = data.dhEvento || new Date().toISOString().replace('Z', '-00:00');

    // Build the envEvento and extract the evento XML and its Id
    const { xml: envEventoXml, eventoXml, id: refId } = xmlBuilder.buildCancNFe({
      cUF,
      tpAmb,
      CNPJ: data.CNPJ,
      chNFe: data.chNFe,
      dhEvento,
      nSeqEvento: data.nSeqEvento || 1,
      nProt: data.nProt,
      xJust: data.xJust,
      idLote: data.idLote || 1,
    });

    // Sign the inner evento element; replace it in the envEvento wrapper
    const signedEventoXml = signatureService.signXml(
      eventoXml,
      refId,
      certificateBuffer,
      certificatePassword
    );

    // Reconstruct envEvento with the signed evento
    const signedEnvEventoXml = envEventoXml.replace(eventoXml, signedEventoXml);

    const soapResult = await soapClient.recepcaoEvento(
      signedEnvEventoXml,
      cUF,
      isProduction,
      certificateBuffer,
      certificatePassword,
      data.endpointOverride
    );

    const soapPayload = data.includeSoap ? buildSoapPayload(soapResult.soap) : undefined;

    return {
      success: true,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao cancelar NF-e: ${error.message}`);
  }
}

/**
 * Inutilizes a range of NF-e numbers (NfeInutilizacao4)
 *
 * @param {Object} data
 * @param {string|number} data.cUF - UF code
 * @param {1|2} data.tpAmb - 1=produção, 2=homologação (overridden by ambiente)
 * @param {string} data.ambiente - 'homologacao' | 'producao'
 * @param {string} data.CNPJ - Emitter CNPJ
 * @param {string|number} data.mod - 55 or 65
 * @param {string|number} data.serie - Series
 * @param {string|number} data.nNFIni - Starting NF-e number
 * @param {string|number} data.nNFFin - Ending NF-e number
 * @param {string} data.xJust - Justification (15-255 chars)
 * @param {boolean} [data.includeSoap=false]
 * @param {string} [data.endpointOverride]
 * @param {string} apiKey
 */
async function inutilizar(data, apiKey) {
  try {
    if (!data.cUF)    throw new Error('Código da UF (cUF) é obrigatório');
    if (!data.CNPJ)   throw new Error('CNPJ do emitente é obrigatório');
    if (!data.mod)    throw new Error('Modelo do documento (mod) é obrigatório');
    if (!data.serie && data.serie !== 0) throw new Error('Série é obrigatória');
    if (!data.nNFIni) throw new Error('Número inicial da NF-e (nNFIni) é obrigatório');
    if (!data.nNFFin) throw new Error('Número final da NF-e (nNFFin) é obrigatório');
    if (!data.xJust)  throw new Error('Justificativa (xJust) é obrigatória');
    if (data.xJust.length < 15) throw new Error('Justificativa deve ter no mínimo 15 caracteres');

    const isProduction = data.ambiente === 'producao';
    const { certificateBuffer, certificatePassword } = await loadCertificate(apiKey);

    const tpAmb = isProduction ? 1 : 2;

    const { xml: inutNFeXml, id: refId } = xmlBuilder.buildInutNFe({
      cUF:    data.cUF,
      tpAmb,
      CNPJ:   data.CNPJ,
      mod:    data.mod,
      serie:  data.serie,
      nNFIni: data.nNFIni,
      nNFFin: data.nNFFin,
      xJust:  data.xJust,
      ano:    data.ano,
    });

    const signedXml = signatureService.signXml(
      inutNFeXml,
      refId,
      certificateBuffer,
      certificatePassword
    );

    const soapResult = await soapClient.inutilizacao(
      signedXml,
      data.cUF,
      isProduction,
      certificateBuffer,
      certificatePassword,
      data.endpointOverride
    );

    const soapPayload = data.includeSoap ? buildSoapPayload(soapResult.soap) : undefined;

    return {
      success: true,
      resultado: soapResult.parsed,
      ...(soapPayload && { soap: soapPayload }),
    };
  } catch (error) {
    throw new Error(`Erro ao inutilizar NF-e: ${error.message}`);
  }
}

module.exports = {
  emitir,
  consultar,
  cancelar,
  inutilizar,
};
