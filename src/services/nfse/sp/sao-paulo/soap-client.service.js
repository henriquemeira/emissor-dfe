const axios = require('axios');
const xml2js = require('xml2js');
const https = require('https');

const DEBUG_NFSE_SP = process.env.NFSE_SP_DEBUG === 'true';

function logDebug(message, ...args) {
  if (DEBUG_NFSE_SP) {
    console.log(message, ...args);
  }
}

function logErrorDebug(message, ...args) {
  if (DEBUG_NFSE_SP) {
    console.error(message, ...args);
  }
}

/**
 * SOAP Client Service for São Paulo NFS-e
 * Handles communication with the São Paulo web service
 */

// SOAP endpoints
// NOTE: The test/homologação endpoint is not officially documented in the available
// materials. The URL below is inferred based on common patterns for São Paulo web services.
// This should be verified with the municipality before production use.
const ENDPOINTS = {
  async: {
    production: 'https://nfews.prefeitura.sp.gov.br/lotenfeasync.asmx',
    test: 'https://nfews-homologacao.prefeitura.sp.gov.br/lotenfeasync.asmx',
  },
  sync: {
    production: 'https://nfews.prefeitura.sp.gov.br/lotenfe.asmx',
    test: 'https://nfews-homologacao.prefeitura.sp.gov.br/lotenfe.asmx',
  },
};

/**
 * Sends a batch of RPS to São Paulo web service (EnvioLoteRpsAsync)
 * @param {string} xml - Signed XML (PedidoEnvioLoteRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function envioLoteRpsAsync(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('EnvioLoteRPS', xml, versaoSchema);
    logDebug('SOAP request EnvioLoteRPS:', soapEnvelope);
    
    // Get endpoint (async)
    const endpoint = isProduction ? ENDPOINTS.async.production : ENDPOINTS.async.test;
    
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPSAsync',
      },
      timeout: 60000, // 60 seconds timeout
      validateStatus: () => true, // Accept any status code to handle manually
    };
    
    // Add client certificate for mTLS if provided
    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true, // Validate server certificate
      });
    }
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    logDebug('SOAP response EnvioLoteRPS:', response.data);
    
    
    // Check for HTTP errors
    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);
      
      // Throw specific error for common HTTP errors
      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponse(response.data);
    
    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      // Error in request setup or parsing
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Tests batch sending (TesteEnvioLoteRpsAsync)
 * @param {string} xml - Signed XML (PedidoEnvioLoteRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function testeEnvioLoteRpsAsync(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('TesteEnvioLoteRPS', xml, versaoSchema);
    logDebug('SOAP request TesteEnvioLoteRPS:', soapEnvelope);
    
    // Get endpoint (async)
    const endpoint = isProduction ? ENDPOINTS.async.production : ENDPOINTS.async.test;
    
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/testeEnvioLoteRPSAsync',
      },
      timeout: 60000,
      validateStatus: () => true, // Accept any status code to handle manually
    };
    
    // Add client certificate for mTLS if provided
    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true, // Validate server certificate
      });
    }
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    logDebug('SOAP response TesteEnvioLoteRPS:', response.data);
    
    
    // Check for HTTP errors
    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);
      
      // Throw specific error for common HTTP errors
      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponse(response.data);
    
    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Builds SOAP envelope for the request
 * @param {string} operationName - Operation name (EnvioLoteRPS or TesteEnvioLoteRPS)
 * @param {string} xml - XML message
 * @param {number} versaoSchema - Schema version
 * @returns {string} SOAP envelope XML
 */
function buildSoapEnvelope(operationName, xml, versaoSchema) {
  // Remove XML declaration from the payload if present
  // The SOAP envelope already has its own declaration
  let cleanXml = xml.trim();
  if (cleanXml.startsWith('<?xml')) {
    cleanXml = cleanXml.replace(/<\?xml[^?]*\?>\s*/i, '');
  }
  
  // DEBUG: Log the clean XML before SOAP wrapping
  if (operationName === 'EnvioLoteRPS') {
    logDebug('=== SYNC: XML LIMPO ANTES DE ENVOLVER NO SOAP ===');
    logDebug(cleanXml);
    logDebug('=== FIM: XML LIMPO ===');
  }
  
  // Use CDATA to include XML without escaping
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://www.prefeitura.sp.gov.br/nfe">
  <soap:Body>
    <tns:${operationName}Request>
      <tns:versaoSchema>${versaoSchema}</tns:versaoSchema>
      <tns:MensagemXML><![CDATA[${cleanXml}]]></tns:MensagemXML>
    </tns:${operationName}Request>
  </soap:Body>
</soap:Envelope>`;

  
  return envelope;
}

/**
 * Builds SOAP envelope for synchronous batch method (EnvioLoteRPS, CancelamentoNFe)
 * NOTE: Synchronous method requires "VersaoSchema" (capital V) instead of "versaoSchema"
 * @param {string} xml - XML message
 * @param {number} versaoSchema - Schema version
 * @param {string} operationName - Operation name (default: 'EnvioLoteRPS')
 * @returns {string} SOAP envelope
 */
function buildSoapEnvelopeSyncBatch(xml, versaoSchema, operationName = 'EnvioLoteRPS') {
  // Remove XML declaration from the payload if present
  let cleanXml = xml.trim();
  if (cleanXml.startsWith('<?xml')) {
    cleanXml = cleanXml.replace(/<\?xml[^?]*\?>\s*/i, '');
    logDebug('Removida declaracao XML do payload (sync batch).');
  }

  // DEBUG: Log the clean XML before SOAP wrapping
  logDebug('=== SYNC: XML LIMPO ANTES DE ENVOLVER NO SOAP ===');
  logDebug(cleanXml);
  logDebug('=== FIM: XML LIMPO ===');
  
  // Use CDATA to include XML without escaping
  // IMPORTANT: Elements inside Request should have tns: prefix for proper namespace qualification
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://www.prefeitura.sp.gov.br/nfe">
  <soap:Body>
    <tns:${operationName}Request>
      <tns:VersaoSchema>${versaoSchema}</tns:VersaoSchema>
      <tns:MensagemXML><![CDATA[${cleanXml}]]></tns:MensagemXML>
    </tns:${operationName}Request>
  </soap:Body>
</soap:Envelope>`;

  return envelope;
}

/**
 * Consults batch status using protocol number (ConsultaSituacaoLote)
 * @param {string} xml - XML message (PedidoConsultaSituacaoLote)
 * @param {number} versaoSchema - Schema version
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function consultaSituacaoLote(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    const soapEnvelope = buildSoapEnvelope('ConsultaSituacaoLote', xml, versaoSchema);
    logDebug('SOAP request ConsultaSituacaoLote:', soapEnvelope);

    const endpoint = isProduction ? ENDPOINTS.async.production : ENDPOINTS.async.test;

    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaSituacaoLote',
      },
      timeout: 60000,
      validateStatus: () => true,
    };

    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true,
      });
    }

    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    logDebug('SOAP response ConsultaSituacaoLote:', response.data);

    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);

      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const parsedResponse = await parseSoapResponse(response.data);

    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Sends a batch of RPS using synchronous method (EnvioLoteRPS - synchronous)
 * This is different from EnvioRPS (individual) - it sends a batch but waits for immediate response
 * @param {string} xml - Signed XML (PedidoEnvioLoteRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function envioLoteRpsSync(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // DEBUG: Log XML being sent
    logDebug('=== SYNC: XML RECEBIDO NA FUNCAO SOAP ===');
    logDebug(xml);
    logDebug('=== FIM: XML RECEBIDO ===');
    logDebug('Versão do Schema:', versaoSchema);
    logDebug('Endpoint:', isProduction ? 'PRODUÇÃO' : 'TESTE');
    
    // Build SOAP envelope for EnvioLoteRPS (synchronous batch)
    // Use buildSoapEnvelopeSyncBatch which uses VersaoSchema (capital V) instead of versaoSchema
    const soapEnvelope = buildSoapEnvelopeSyncBatch(xml, versaoSchema);
    
    // DEBUG: Log SOAP envelope with XML
    logDebug('=== SYNC: ENVELOPE SOAP COMPLETO ===');
    logDebug(soapEnvelope);
    logDebug('=== FIM: ENVELOPE SOAP ===');
    
    // Get endpoint (sync)
    const endpoint = isProduction ? ENDPOINTS.sync.production : ENDPOINTS.sync.test;
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS',
      },
      timeout: 60000, // 60 seconds timeout
      validateStatus: () => true, // Accept any status code to handle manually
    };
    
    // Add client certificate for mTLS if provided
    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true, // Validate server certificate
      });
    }
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    
    // DEBUG: Log response
    logDebug('=== SYNC: RESPOSTA SOAP RECEBIDA ===');
    logDebug(response.data);
    logDebug('=== FIM: RESPOSTA SOAP ===');
    
    // Check for HTTP errors
    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);
      
      // Throw specific error for common HTTP errors
      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponseEnvioLoteRpsSync(response.data);
    
    // DEBUG: Log parsed response
    logDebug('=== SYNC: RESPOSTA PARSEADA ===');
    logDebug(JSON.stringify(parsedResponse, null, 2));
    logDebug('=== FIM: RESPOSTA PARSEADA ===');
    
    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      // Error in request setup or parsing
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Sends a single RPS to São Paulo Web Service (EnvioRPS - synchronous)
 * @param {string} xml - Signed XML (PedidoEnvioRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from Web Service
 */
async function envioRps(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('EnvioRPS', xml, versaoSchema);
    logDebug('SOAP request EnvioRPS:', soapEnvelope);
    
    // Get endpoint - use the synchronous endpoint (lotenfe.asmx)
    const syncEndpoints = {
      production: 'https://nfews.prefeitura.sp.gov.br/lotenfe.asmx',
      test: 'https://nfews-homologacao.prefeitura.sp.gov.br/lotenfe.asmx',
    };
    const endpoint = isProduction ? syncEndpoints.production : syncEndpoints.test;
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioRPS',
      },
      timeout: 60000, // 60 seconds timeout
      validateStatus: () => true, // Accept any status code to handle manually
    };
    
    // Add client certificate for mTLS if provided
    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true, // Validate server certificate
      });
    }
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    logDebug('SOAP response EnvioRPS:', response.data);
    
    // Check for HTTP errors
    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);
      
      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponseEnvioRps(response.data);
    
    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Escapes XML special characters
 * @param {string} xml - XML string
 * @returns {string} Escaped XML
 */
function escapeXml(xml) {
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Parses SOAP response
 * @param {string} soapXml - SOAP response XML
 * @returns {Object} Parsed response
 */
async function parseSoapResponse(soapXml) {
  try {
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });
    
    const result = await parser.parseStringPromise(soapXml);
    
    
    // Navigate SOAP structure - try different possible structures
    let body = result.Envelope?.Body;
    
    // If not found, try without stripping prefix (in case the parser didn't work as expected)
    if (!body && result['soap:Envelope']) {
      body = result['soap:Envelope']['soap:Body'];
    }
    
    if (!body && result['soapenv:Envelope']) {
      body = result['soapenv:Envelope']['soapenv:Body'];
    }
    
    if (!body) {
      logErrorDebug('SOAP Body não encontrado. Estrutura recebida:', JSON.stringify(result, null, 2));
      throw new Error('SOAP Body não encontrado na resposta');
    }
    
    // Check for SOAP fault
    if (body.Fault) {
      throw new Error(`SOAP Fault: ${body.Fault.faultstring || 'Erro desconhecido'}`);
    }
    
    const responseAsync = body.EnvioLoteRPSResponseAsync || body.TesteEnvioLoteRPSResponseAsync;
    const responseConsulta = body.ConsultaSituacaoLoteResponse || body.ConsultaSituacaoLoteResponseAsync;

    if (!responseAsync && !responseConsulta) {
      throw new Error('Resposta esperada não encontrada');
    }

    const retornoXML = (responseConsulta || responseAsync).RetornoXML;
    if (!retornoXML) {
      return { success: false, error: 'RetornoXML não encontrado na resposta' };
    }

    let parsedRetorno = retornoXML;
    if (typeof retornoXML === 'string') {
      parsedRetorno = await parser.parseStringPromise(retornoXML);
    }

    if (responseConsulta) {
      return parseRetornoConsultaSituacaoLote(parsedRetorno);
    }

    return parseRetornoEnvioLoteRPSAsync(parsedRetorno);
  } catch (error) {
    throw new Error(`Erro ao processar resposta SOAP: ${error.message}`);
  }
}

/**
 * Ensures a value is an array
 * @param {*} value - Value to normalize
 * @returns {Array} Array containing the value(s)
 */
function ensureArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Parses SOAP response for EnvioRPS (synchronous)
 * @param {string} soapXml - SOAP response XML
 * @returns {Object} Parsed response
 */
async function parseSoapResponseEnvioRps(soapXml) {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });
    
    const result = await parser.parseStringPromise(soapXml);
    
    // Navigate SOAP structure
    let body = result.Envelope?.Body;
    
    if (!body && result['soap:Envelope']) {
      body = result['soap:Envelope']['soap:Body'];
    }
    
    if (!body && result['soapenv:Envelope']) {
      body = result['soapenv:Envelope']['soapenv:Body'];
    }
    
    if (!body) {
      logErrorDebug('SOAP Body não encontrado. Estrutura recebida:', JSON.stringify(result, null, 2));
      throw new Error('SOAP Body não encontrado na resposta');
    }
    
    // Check for SOAP fault
    if (body.Fault) {
      throw new Error(`SOAP Fault: ${body.Fault.faultstring || 'Erro desconhecido'}`);
    }
    
    const response = body.EnvioRPSResponse;
    
    if (!response) {
      throw new Error('EnvioRPSResponse não encontrado na resposta');
    }

    const retornoXML = response.RetornoXML;
    if (!retornoXML) {
      return { success: false, error: 'RetornoXML não encontrado na resposta' };
    }

    let parsedRetorno = retornoXML;
    if (typeof retornoXML === 'string') {
      parsedRetorno = await parser.parseStringPromise(retornoXML);
    }

    return parseRetornoEnvioRPS(parsedRetorno);
  } catch (error) {
    throw new Error(`Erro ao processar resposta SOAP: ${error.message}`);
  }
}

/**
 * Parses SOAP response for EnvioLoteRPS synchronous method
 * @param {string} soapXml - SOAP response XML
 * @returns {Object} Parsed response
 */
async function parseSoapResponseEnvioLoteRpsSync(soapXml) {
  try {
    // DEBUG: Log raw SOAP response
    logDebug('=== SYNC: ANALISANDO RESPOSTA SOAP ===');
    logDebug('Tamanho da resposta:', soapXml.length);
    
    const parser = new xml2js.Parser({
      explicitArray: true,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });
    
    const result = await parser.parseStringPromise(soapXml);
    
    // DEBUG: Log parsed SOAP structure
    logDebug('=== SYNC: ESTRUTURA SOAP PARSEADA ===');
    logDebug(JSON.stringify(result, null, 2));
    logDebug('=== FIM: ESTRUTURA SOAP ===');
    
    // Navigate SOAP structure - with stripPrefix enabled, Envelope is NOT an array but Body is
    let body = result.Envelope?.Body?.[0];
    
    if (!body) {
      logErrorDebug('SOAP Body não encontrado. Estrutura recebida:', JSON.stringify(result, null, 2));
      throw new Error('SOAP Body não encontrado na resposta');
    }
    
    // Check for SOAP fault
    if (body.Fault) {
      const fault = body.Fault[0];
      throw new Error(`SOAP Fault: ${fault.faultstring?.[0] || 'Erro desconhecido'}`);
    }
    
    // With explicitArray: true, elements are in arrays
    const response = body.EnvioLoteRPSResponse?.[0];
    
    if (!response) {
      logErrorDebug('EnvioLoteRPSResponse não encontrado. Body:', JSON.stringify(body, null, 2));
      throw new Error('EnvioLoteRPSResponse não encontrado na resposta');
    }
    
    // DEBUG: Log response structure
    logDebug('=== SYNC: RESPOSTA DO ENVELOPE ===');
    logDebug(JSON.stringify(response, null, 2));
    logDebug('=== FIM: RESPOSTA ===');
    
    // Extract RetornoXML - it's a string containing XML
    const retornoXml = response.RetornoXML?.[0];
    
    if (!retornoXml) {
      logErrorDebug('RetornoXML não encontrado. Response:', JSON.stringify(response, null, 2));
      throw new Error('RetornoXML não encontrado na resposta');
    }
    
    // DEBUG: Log the RetornoXML string
    logDebug('=== SYNC: RETORNO XML STRING ===');
    logDebug(retornoXml);
    logDebug('=== FIM: RETORNO XML ===');
    
    // Parse the nested RetornoXML string
    const parsedRetorno = await parser.parseStringPromise(retornoXml);
    
    // DEBUG: Log parsed retorno
    logDebug('=== SYNC: RETORNO PARSEADO ===');
    logDebug(JSON.stringify(parsedRetorno, null, 2));
    logDebug('=== FIM: RETORNO PARSEADO ===');
    
    // Parse and structure the return
    return parseRetornoEnvioLoteRPS(parsedRetorno);
  } catch (error) {
    throw new Error(`Erro ao analisar resposta SOAP: ${error.message}`);
  }
}

/**
 * Parses RetornoEnvioLoteRPS structure (synchronous batch method)
 * @param {Object} retorno - Parsed XML object
 * @returns {Object} Structured response
 */
function parseRetornoEnvioLoteRPS(retorno) {
  // Handle root element - with explicitArray: true, elements are arrays
  let root = retorno.RetornoEnvioLoteRPS;
  
  // If it's an array, get the first element
  if (Array.isArray(root)) {
    root = root[0];
  }
  
  // If still not found, use retorno itself
  if (!root) {
    root = retorno;
  }
  
  const response = {
    cabecalho: null,
    alertas: [],
    erros: [],
    chavesNFeRPS: [],
  };
  
  // Parse Cabecalho
  if (root.Cabecalho && root.Cabecalho[0]) {
    const cab = root.Cabecalho[0];
    response.cabecalho = {
      sucesso: cab.Sucesso ? cab.Sucesso[0] === 'true' : false,
      versao: cab.$ && cab.$.Versao ? parseInt(cab.$.Versao, 10) : null,
    };
    
    // Parse InformacoesLote if present
    if (cab.InformacoesLote && cab.InformacoesLote[0]) {
      const info = cab.InformacoesLote[0];
      response.cabecalho.informacoesLote = {
        numeroLote: info.NumeroLote ? info.NumeroLote[0] : null,
        inscricaoPrestador: info.InscricaoPrestador ? info.InscricaoPrestador[0] : null,
        cpfCnpjRemetente: null,
        dataEnvioLote: info.DataEnvioLote ? info.DataEnvioLote[0] : null,
        qtdNotasProcessadas: info.QtdNotasProcessadas ? parseInt(info.QtdNotasProcessadas[0], 10) : null,
        tempoProcessamento: info.TempoProcessamento ? parseInt(info.TempoProcessamento[0], 10) : null,
        valorTotalServicos: info.ValorTotalServicos ? parseFloat(info.ValorTotalServicos[0]) : null,
        valorTotalDeducoes: info.ValorTotalDeducoes ? parseFloat(info.ValorTotalDeducoes[0]) : null,
      };
      
      // Parse CPFCNPJRemetente
      if (info.CPFCNPJRemetente && info.CPFCNPJRemetente[0]) {
        const cpfCnpj = info.CPFCNPJRemetente[0];
        response.cabecalho.informacoesLote.cpfCnpjRemetente = {
          cnpj: cpfCnpj.CNPJ ? cpfCnpj.CNPJ[0] : null,
          cpf: cpfCnpj.CPF ? cpfCnpj.CPF[0] : null,
        };
      }
    }
  }
  
  // Parse Alertas (multiple possible)
  if (root.Alerta) {
    root.Alerta.forEach(alerta => {
      response.alertas.push({
        codigo: alerta.Codigo ? alerta.Codigo[0] : null,
        descricao: alerta.Descricao ? alerta.Descricao[0] : null,
      });
    });
  }
  
  // Parse Erros (multiple possible)
  if (root.Erro) {
    root.Erro.forEach(erro => {
      response.erros.push({
        codigo: erro.Codigo ? erro.Codigo[0] : null,
        descricao: erro.Descricao ? erro.Descricao[0] : null,
      });
    });
  }
  
  // Parse ChaveNFeRPS (multiple possible - up to 50)
  if (root.ChaveNFeRPS) {
    root.ChaveNFeRPS.forEach(chave => {
      const chaveNFeRPS = {
        inscricaoPrestador: chave.InscricaoPrestador ? chave.InscricaoPrestador[0] : null,
        numeroNFe: chave.NumeroNFe ? chave.NumeroNFe[0] : null,
        codigoVerificacao: chave.CodigoVerificacao ? chave.CodigoVerificacao[0] : null,
        chaveRPS: null,
      };
      
      // Parse ChaveRPS
      if (chave.ChaveRPS && chave.ChaveRPS[0]) {
        const chaveRPS = chave.ChaveRPS[0];
        chaveNFeRPS.chaveRPS = {
          inscricaoPrestador: chaveRPS.InscricaoPrestador ? chaveRPS.InscricaoPrestador[0] : null,
          serieRPS: chaveRPS.SerieRPS ? chaveRPS.SerieRPS[0] : null,
          numeroRPS: chaveRPS.NumeroRPS ? chaveRPS.NumeroRPS[0] : null,
        };
      }
      
      response.chavesNFeRPS.push(chaveNFeRPS);
    });
  }
  
  return response;
}

/**
 * Parses RetornoEnvioLoteRPSAsync structure
 * @param {Object} retorno - Parsed RetornoXML
 * @returns {Object} Formatted response
 */
function parseRetornoEnvioLoteRPSAsync(retorno) {
  // Handle different possible structures
  const root = retorno.RetornoEnvioLoteRPSAsync || retorno;
  
  const cabecalho = root.Cabecalho || {};
  const erros = ensureArray(root.Erro);
  
  const response = {
    sucesso: cabecalho.Sucesso === 'true' || cabecalho.Sucesso === true,
    versao: cabecalho.$?.Versao || cabecalho.Versao,
  };
  
  // Add lote information if successful
  if (cabecalho.InformacoesLote) {
    response.informacoesLote = {
      numeroProtocolo: cabecalho.InformacoesLote.NumeroProtocolo,
      dataRecebimento: cabecalho.InformacoesLote.DataRecebimento,
    };
  }
  
  // Add errors if any
  if (erros.length > 0) {
    response.erros = erros.map(erro => ({
      codigo: erro.Codigo,
      descricao: erro.Descricao,
    }));
  }
  
  return response;
}

/**
 * Parses RetornoEnvioRPS structure (synchronous)
 * @param {Object} retorno - Parsed RetornoXML
 * @returns {Object} Formatted response
 */
function parseRetornoEnvioRPS(retorno) {
  const root = retorno.RetornoEnvioRPS || retorno;
  
  const cabecalho = root.Cabecalho || {};
  const erros = ensureArray(root.Erro);
  const alertas = ensureArray(root.Alerta);
  
  const response = {
    sucesso: cabecalho.Sucesso === 'true' || cabecalho.Sucesso === true,
    versao: cabecalho.$?.Versao || cabecalho.Versao,
  };
  
  // Add ChaveNFeRPS (NFS-e and RPS keys) if successful
  if (root.ChaveNFeRPS) {
    response.chaveNFeRPS = {
      chaveNFe: {},
      chaveRPS: {},
    };
    
    if (root.ChaveNFeRPS.ChaveNFe) {
      const chaveNFe = root.ChaveNFeRPS.ChaveNFe;
      response.chaveNFeRPS.chaveNFe = {
        inscricaoPrestador: chaveNFe.InscricaoPrestador,
        numeroNFe: chaveNFe.NumeroNFe,
        codigoVerificacao: chaveNFe.CodigoVerificacao,
      };
    }
    
    if (root.ChaveNFeRPS.ChaveRPS) {
      const chaveRPS = root.ChaveNFeRPS.ChaveRPS;
      response.chaveNFeRPS.chaveRPS = {
        inscricaoPrestador: chaveRPS.InscricaoPrestador,
        serieRPS: chaveRPS.SerieRPS,
        numeroRPS: chaveRPS.NumeroRPS,
      };
    }
  }
  
  // Add alerts if any
  if (alertas.length > 0) {
    response.alertas = alertas.map(alerta => ({
      codigo: alerta.Codigo,
      descricao: alerta.Descricao,
    }));
  }
  
  // Add errors if any
  if (erros.length > 0) {
    response.erros = erros.map(erro => ({
      codigo: erro.Codigo,
      descricao: erro.Descricao,
    }));
  }
  
  return response;
}

/**
 * Parses RetornoConsultaSituacaoLote structure
 * @param {Object} retorno - Parsed RetornoXML
 * @returns {Object} Formatted response
 */
function parseRetornoConsultaSituacaoLote(retorno) {
  const root = retorno.RetornoConsultaSituacaoLote || retorno;
  const erros = ensureArray(root.Erro);

  const response = {
    sucesso: root.Sucesso === 'true' || root.Sucesso === true,
  };

  if (root.Situacao !== undefined) {
    response.situacao = {
      valor: typeof root.Situacao === 'object' ? root.Situacao._ : root.Situacao,
      nome: root.Situacao?.$?.nome,
    };
  }

  if (root.NumeroLote) {
    response.numeroLote = root.NumeroLote;
  }

  if (root.DataRecebimento) {
    response.dataRecebimento = root.DataRecebimento;
  }

  if (root.DataProcessamento) {
    response.dataProcessamento = root.DataProcessamento;
  }

  if (root.ResultadoOperacao) {
    response.resultadoOperacao = root.ResultadoOperacao;
  }

  if (erros.length > 0) {
    response.erros = erros.map(erro => ({
      codigo: erro.Codigo,
      descricao: erro.Descricao,
    }));
  }

  return response;
}

/**
 * Cancels one or more NFSe (CancelamentoNFe)
 * @param {string} xml - Signed XML (PedidoCancelamentoNFe)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function cancelamentoNFe(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // Build SOAP envelope for CancelamentoNFe
    const soapEnvelope = buildSoapEnvelopeSyncBatch(xml, versaoSchema, 'CancelamentoNFe');
    logDebug('SOAP request CancelamentoNFe:', soapEnvelope);
    
    // Get endpoint (sync - cancelamento uses sync endpoint)
    const endpoint = isProduction ? ENDPOINTS.sync.production : ENDPOINTS.sync.test;
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/cancelamentoNFe',
      },
      timeout: 60000, // 60 seconds timeout
      validateStatus: () => true, // Accept any status code to handle manually
    };
    
    // Add client certificate for mTLS if provided
    if (certificateBuffer && certificatePassword) {
      requestConfig.httpsAgent = new https.Agent({
        pfx: certificateBuffer,
        passphrase: certificatePassword,
        rejectUnauthorized: true, // Validate server certificate
      });
    }
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, requestConfig);
    logDebug('SOAP response CancelamentoNFe:', response.data);
    
    // Check for HTTP errors
    if (response.status >= 400) {
      logErrorDebug('Erro HTTP:', response.status, response.statusText);
      
      // Throw specific error for common HTTP errors
      if (response.status === 403) {
        throw new Error('Acesso negado (403). Verifique se o certificado digital está configurado corretamente e se tem permissão para acessar o serviço.');
      } else if (response.status === 401) {
        throw new Error('Não autorizado (401). Verifique as credenciais de autenticação.');
      } else if (response.status === 404) {
        throw new Error('Serviço não encontrado (404). Verifique a URL do endpoint.');
      } else if (response.status >= 500) {
        throw new Error(`Erro interno do servidor (${response.status}). Tente novamente mais tarde.`);
      } else {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponseCancelamentoNFe(response.data);
    
    return {
      parsed: parsedResponse,
      soap: {
        request: soapEnvelope,
        response: response.data,
      },
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      logErrorDebug('Erro na resposta do servidor:', error.response.status);
      throw new Error(`Erro do servidor (${error.response.status}): ${error.message}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      // Error in request setup or parsing
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Parses SOAP response for CancelamentoNFe
 * @param {string} soapXml - SOAP response XML
 * @returns {Object} Parsed response
 */
async function parseSoapResponseCancelamentoNFe(soapXml) {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsed = await parser.parseStringPromise(soapXml);
    
    // Navigate SOAP structure
    const soapBody = parsed['soap:Envelope']['soap:Body'];
    const response = soapBody.CancelamentoNFeResponse;
    
    if (!response || !response.RetornoXML) {
      throw new Error('Resposta inválida do web service');
    }
    
    // Parse RetornoXML
    const retornoXml = response.RetornoXML;
    const retornoParsed = await parser.parseStringPromise(retornoXml);
    
    // Parse RetornoCancelamentoNFe
    const retorno = retornoParsed.RetornoCancelamentoNFe;
    
    return parseRetornoCancelamentoNFe(retorno);
  } catch (error) {
    throw new Error(`Erro ao processar resposta SOAP: ${error.message}`);
  }
}

/**
 * Parses RetornoCancelamentoNFe structure
 * @param {Object} retorno - Parsed RetornoCancelamentoNFe object
 * @returns {Object} Formatted response
 */
function parseRetornoCancelamentoNFe(retorno) {
  const root = retorno.RetornoCancelamentoNFe || retorno;
  const cabecalho = root.Cabecalho;
  const erros = ensureArray(root.Erro);
  const alertas = ensureArray(root.Alerta);

  const response = {
    sucesso: cabecalho.Sucesso === 'true' || cabecalho.Sucesso === true,
  };

  if (alertas.length > 0) {
    response.alertas = alertas.map(alerta => ({
      codigo: alerta.Codigo,
      descricao: alerta.Descricao,
    }));
  }

  if (erros.length > 0) {
    response.erros = erros.map(erro => ({
      codigo: erro.Codigo,
      descricao: erro.Descricao,
    }));
  }

  return response;
}

module.exports = {
  envioLoteRpsAsync,
  testeEnvioLoteRpsAsync,
  consultaSituacaoLote,
  envioRps,
  envioLoteRpsSync,
  cancelamentoNFe,
};
