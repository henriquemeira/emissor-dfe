const axios = require('axios');
const xml2js = require('xml2js');

/**
 * SOAP Client Service for São Paulo NFS-e
 * Handles communication with the São Paulo web service
 */

// SOAP endpoints
const ENDPOINTS = {
  production: 'https://nfews.prefeitura.sp.gov.br/lotenfeasync.asmx',
  test: 'https://nfews-homologacao.prefeitura.sp.gov.br/lotenfeasync.asmx', // Assuming test endpoint
};

/**
 * Sends a batch of RPS to São Paulo web service (EnvioLoteRpsAsync)
 * @param {string} xml - Signed XML (PedidoEnvioLoteRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @returns {Object} Parsed response from web service
 */
async function envioLoteRpsAsync(xml, versaoSchema = 1, isProduction = false) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('EnvioLoteRPS', xml, versaoSchema);
    
    // Get endpoint
    const endpoint = isProduction ? ENDPOINTS.production : ENDPOINTS.test;
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPSAsync',
      },
      timeout: 60000, // 60 seconds timeout
    });
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponse(response.data);
    
    return parsedResponse;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const parsedError = await parseSoapResponse(error.response.data);
      throw new Error(`Erro do servidor: ${JSON.stringify(parsedError)}`);
    } else if (error.request) {
      // Request was made but no response
      throw new Error('Sem resposta do servidor. Verifique a conexão.');
    } else {
      // Error in request setup
      throw new Error(`Erro ao enviar requisição: ${error.message}`);
    }
  }
}

/**
 * Tests batch sending (TesteEnvioLoteRpsAsync)
 * @param {string} xml - Signed XML (PedidoEnvioLoteRPS)
 * @param {number} versaoSchema - Schema version (1 for v01-1)
 * @param {boolean} isProduction - Whether to use production endpoint
 * @returns {Object} Parsed response from web service
 */
async function testeEnvioLoteRpsAsync(xml, versaoSchema = 1, isProduction = false) {
  try {
    // Build SOAP envelope
    const soapEnvelope = buildSoapEnvelope('TesteEnvioLoteRPS', xml, versaoSchema);
    
    // Get endpoint
    const endpoint = isProduction ? ENDPOINTS.production : ENDPOINTS.test;
    
    // Send SOAP request
    const response = await axios.post(endpoint, soapEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/testeEnvioLoteRPSAsync',
      },
      timeout: 60000,
    });
    
    // Parse SOAP response
    const parsedResponse = await parseSoapResponse(response.data);
    
    return parsedResponse;
  } catch (error) {
    if (error.response) {
      const parsedError = await parseSoapResponse(error.response.data);
      throw new Error(`Erro do servidor: ${JSON.stringify(parsedError)}`);
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
  // Escape XML for inclusion in SOAP body
  const escapedXml = escapeXml(xml);
  
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://www.prefeitura.sp.gov.br/nfe">
  <soap:Body>
    <tns:${operationName}Request>
      <versaoSchema>${versaoSchema}</versaoSchema>
      <MensagemXML>${escapedXml}</MensagemXML>
    </tns:${operationName}Request>
  </soap:Body>
</soap:Envelope>`;
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
    
    // Navigate SOAP structure
    const body = result.Envelope?.Body;
    if (!body) {
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

module.exports = {
  envioLoteRpsAsync,
  testeEnvioLoteRpsAsync,
};
