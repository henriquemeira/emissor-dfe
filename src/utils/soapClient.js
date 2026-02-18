const axios = require('axios');

/**
 * SOAP Client for NFS-e São Paulo Web Service
 */
class SoapClient {
  constructor() {
    // Production endpoint
    this.endpoint = 'https://nfews.prefeitura.sp.gov.br/ws/lotenfeasync.asmx';
    
    // Test endpoint (homologation)
    // this.endpoint = 'https://nfews-homologacao.prefeitura.sp.gov.br/ws/lotenfeasync.asmx';
  }

  /**
   * Send EnvioLoteRPS request (Async)
   * @param {string} xmlMessage - Signed XML message
   * @param {number} versaoSchema - Schema version (1 for v01-1)
   * @returns {Promise<Object>} Response from web service
   */
  async envioLoteRPS(xmlMessage, versaoSchema = 1) {
    const soapEnvelope = this.buildSoapEnvelope('EnvioLoteRPS', xmlMessage, versaoSchema);
    
    try {
      const response = await axios.post(this.endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS'
        },
        timeout: 60000 // 60 seconds timeout
      });
      
      return this.parseResponse(response.data, 'EnvioLoteRPS');
    } catch (error) {
      if (error.response) {
        // Server responded with error
        return this.parseErrorResponse(error.response.data);
      }
      throw new Error(`Erro ao comunicar com webservice: ${error.message}`);
    }
  }

  /**
   * Test EnvioLoteRPS (for validation)
   * @param {string} xmlMessage - Signed XML message
   * @param {number} versaoSchema - Schema version
   * @returns {Promise<Object>} Test response
   */
  async testeEnvioLoteRPS(xmlMessage, versaoSchema = 1) {
    const soapEnvelope = this.buildSoapEnvelope('TesteEnvioLoteRPS', xmlMessage, versaoSchema);
    
    try {
      const response = await axios.post(this.endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://www.prefeitura.sp.gov.br/nfe/ws/testeenvio'
        },
        timeout: 60000
      });
      
      return this.parseResponse(response.data, 'TesteEnvioLoteRPS');
    } catch (error) {
      if (error.response) {
        return this.parseErrorResponse(error.response.data);
      }
      throw new Error(`Erro ao comunicar com webservice: ${error.message}`);
    }
  }

  /**
   * Build SOAP envelope
   * @param {string} method - Web service method name
   * @param {string} xmlMessage - XML message content
   * @param {number} versaoSchema - Schema version
   * @returns {string} SOAP envelope
   */
  buildSoapEnvelope(method, xmlMessage, versaoSchema) {
    // Escape XML message for embedding in SOAP
    const escapedXml = this.escapeXml(xmlMessage);
    
    let envelope = '<?xml version="1.0" encoding="utf-8"?>\n';
    envelope += '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ';
    envelope += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    envelope += 'xmlns:xsd="http://www.w3.org/2001/XMLSchema">\n';
    envelope += '  <soap:Body>\n';
    envelope += `    <${method}Request xmlns="http://www.prefeitura.sp.gov.br/nfe">\n`;
    envelope += `      <versaoSchema>${versaoSchema}</versaoSchema>\n`;
    envelope += `      <MensagemXML>${escapedXml}</MensagemXML>\n`;
    envelope += `    </${method}Request>\n`;
    envelope += '  </soap:Body>\n';
    envelope += '</soap:Envelope>';
    
    return envelope;
  }

  /**
   * Parse SOAP response
   * @param {string} soapResponse - SOAP response XML
   * @param {string} method - Method name
   * @returns {Object} Parsed response
   */
  parseResponse(soapResponse, method) {
    try {
      // Extract RetornoXML from SOAP response
      const responseTag = `${method}ResponseAsync`;
      const returnXmlMatch = soapResponse.match(/<RetornoXML>([\s\S]*?)<\/RetornoXML>/);
      
      if (!returnXmlMatch) {
        throw new Error('Resposta inválida do webservice');
      }
      
      const returnXml = this.unescapeXml(returnXmlMatch[1]);
      
      // Parse return XML to extract key information
      const parsed = this.parseReturnXml(returnXml);
      
      return {
        success: true,
        rawXml: returnXml,
        parsed: parsed
      };
    } catch (error) {
      throw new Error(`Erro ao processar resposta: ${error.message}`);
    }
  }

  /**
   * Parse return XML from web service
   * @param {string} xml - Return XML
   * @returns {Object} Parsed data
   */
  parseReturnXml(xml) {
    const result = {
      sucesso: false,
      erros: [],
      alertas: [],
      protocolo: null,
      dataRecebimento: null
    };
    
    // Extract success
    const sucessoMatch = xml.match(/<Sucesso>(true|false)<\/Sucesso>/i);
    if (sucessoMatch) {
      result.sucesso = sucessoMatch[1].toLowerCase() === 'true';
    }
    
    // Extract protocol number (async)
    const protocoloMatch = xml.match(/<NumeroProtocolo>([^<]+)<\/NumeroProtocolo>/);
    if (protocoloMatch) {
      result.protocolo = protocoloMatch[1];
    }
    
    // Extract data recebimento
    const dataMatch = xml.match(/<DataRecebimento>([^<]+)<\/DataRecebimento>/);
    if (dataMatch) {
      result.dataRecebimento = dataMatch[1];
    }
    
    // Extract errors
    const erroMatches = xml.matchAll(/<Erro>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]*)<\/Descricao>[\s\S]*?<\/Erro>/g);
    for (const match of erroMatches) {
      result.erros.push({
        codigo: match[1],
        descricao: match[2]
      });
    }
    
    // Extract alerts (if any)
    const alertaMatches = xml.matchAll(/<Alerta>[\s\S]*?<Codigo>([^<]+)<\/Codigo>[\s\S]*?<Descricao>([^<]*)<\/Descricao>[\s\S]*?<\/Alerta>/g);
    for (const match of alertaMatches) {
      result.alertas.push({
        codigo: match[1],
        descricao: match[2]
      });
    }
    
    return result;
  }

  /**
   * Parse error response from SOAP fault
   * @param {string} soapResponse - SOAP fault response
   * @returns {Object} Error information
   */
  parseErrorResponse(soapResponse) {
    try {
      const faultMatch = soapResponse.match(/<faultstring>([^<]*)<\/faultstring>/);
      const errorMessage = faultMatch ? faultMatch[1] : 'Erro desconhecido no webservice';
      
      return {
        success: false,
        error: {
          codigo: 'SOAP_FAULT',
          mensagem: errorMessage,
          rawResponse: soapResponse
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          codigo: 'PARSE_ERROR',
          mensagem: 'Erro ao processar resposta de erro do webservice',
          rawResponse: soapResponse
        }
      };
    }
  }

  /**
   * Escape XML for embedding in SOAP
   */
  escapeXml(xml) {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Unescape XML from SOAP
   */
  unescapeXml(xml) {
    return xml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&');
  }
}

module.exports = SoapClient;
