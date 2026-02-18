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
  production: 'https://nfews.prefeitura.sp.gov.br/lotenfeasync.asmx',
  test: 'https://nfews-homologacao.prefeitura.sp.gov.br/lotenfeasync.asmx',
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
    
    // Get endpoint
    const endpoint = isProduction ? ENDPOINTS.production : ENDPOINTS.test;
    
    
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
    
    // Get endpoint
    const endpoint = isProduction ? ENDPOINTS.production : ENDPOINTS.test;
    
    
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
    logDebug('Removida declaracao XML do payload.');
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
    
    // Extract response (could be EnvioLoteRPSResponseAsync or TesteEnvioLoteRPSResponseAsync)
    const responseAsync = body.EnvioLoteRPSResponseAsync || body.TesteEnvioLoteRPSResponseAsync;
    if (!responseAsync) {
      throw new Error('Resposta esperada não encontrada');
    }
    
    // Extract RetornoXML
    const retornoXML = responseAsync.RetornoXML;
    if (!retornoXML) {
      return { success: false, error: 'RetornoXML não encontrado na resposta' };
    }
    
    // Parse the inner XML if it's a string
    let parsedRetorno = retornoXML;
    if (typeof retornoXML === 'string') {
      parsedRetorno = await parser.parseStringPromise(retornoXML);
    }
    
    return parseRetornoEnvioLoteRPSAsync(parsedRetorno);
  } catch (error) {
    throw new Error(`Erro ao processar resposta SOAP: ${error.message}`);
  }
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
  const erros = root.Erro ? (Array.isArray(root.Erro) ? root.Erro : [root.Erro]) : [];
  
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
 * Consults batch status (ConsultaSituacaoLote)
 * @param {string} xml - XML for consultation (PedidoConsultaSituacaoLote)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @param {Buffer} certificateBuffer - Certificate PFX buffer for mTLS authentication
 * @param {string} certificatePassword - Certificate password
 * @returns {Object} Parsed response from web service
 */
async function consultaSituacaoLote(xml, versaoSchema = 1, isProduction = false, certificateBuffer = null, certificatePassword = null) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('ConsultaSituacaoLote', xml, versaoSchema);
    
    // Get endpoint
    const endpoint = isProduction ? ENDPOINTS.production : ENDPOINTS.test;
    
    
    // Configure HTTPS agent with client certificate if provided
    const requestConfig = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/consultaSituacaoLote',
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
    const parsedResponse = await parseSoapResponseConsulta(response.data);
    
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
 * Parses SOAP response for ConsultaSituacaoLote
 * @param {string} soapXml - SOAP response XML
 * @returns {Object} Parsed response
 */
async function parseSoapResponseConsulta(soapXml) {
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
    
    // Extract response
    const responseConsulta = body.ConsultaSituacaoLoteResponse;
    if (!responseConsulta) {
      throw new Error('Resposta esperada não encontrada');
    }
    
    // Extract RetornoXML
    const retornoXML = responseConsulta.RetornoXML;
    if (!retornoXML) {
      return { success: false, error: 'RetornoXML não encontrado na resposta' };
    }
    
    // Parse the inner XML if it's a string
    let parsedRetorno = retornoXML;
    if (typeof retornoXML === 'string') {
      parsedRetorno = await parser.parseStringPromise(retornoXML);
    }
    
    return parseRetornoConsultaSituacaoLote(parsedRetorno);
  } catch (error) {
    throw new Error(`Erro ao processar resposta SOAP: ${error.message}`);
  }
}

/**
 * Parses RetornoConsultaSituacaoLote structure
 * @param {Object} retorno - Parsed RetornoXML
 * @returns {Object} Formatted response
 */
function parseRetornoConsultaSituacaoLote(retorno) {
  // Handle different possible structures
  const root = retorno.RetornoConsultaSituacaoLote || retorno;
  
  const erros = root.Erro ? (Array.isArray(root.Erro) ? root.Erro : [root.Erro]) : [];
  
  const response = {
    sucesso: root.Sucesso === 'true' || root.Sucesso === true,
  };
  
  // Add situation information
  if (root.Situacao) {
    const situacaoValue = root.Situacao._ || root.Situacao;
    const situacaoNome = root.Situacao.$ ? root.Situacao.$.nome : null;
    
    response.situacao = {
      codigo: parseInt(situacaoValue, 10),
      nome: situacaoNome,
    };
  }
  
  // Add batch number if present
  if (root.NumeroLote) {
    response.numeroLote = root.NumeroLote;
  }
  
  // Add dates if present
  if (root.DataRecebimento) {
    response.dataRecebimento = root.DataRecebimento;
  }
  
  if (root.DataProcessamento) {
    response.dataProcessamento = root.DataProcessamento;
  }
  
  // Add result if present
  if (root.ResultadoOperacao) {
    response.resultadoOperacao = root.ResultadoOperacao;
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

module.exports = {
  envioLoteRpsAsync,
  testeEnvioLoteRpsAsync,
  consultaSituacaoLote,
};
