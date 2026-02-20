const axios = require('axios');
const https = require('https');
const xml2js = require('xml2js');

/**
 * SEFAZ NF-e SOAP Client Service
 * Handles communication with SEFAZ NF-e webservices (version 4.00)
 * Uses SOAP 1.2 as required by SEFAZ for NF-e.
 */

// ---------------------------------------------------------------------------
// SEFAZ NF-e Endpoint Table (NF-e version 4.00)
// Sources: MOC NF-e v7.0 and official SEFAZ documentation
// UF codes follow IBGE table
// ---------------------------------------------------------------------------

const ENDPOINTS = {
  // NFeAutorizacao4
  autorizacao: {
    hom: {
      12: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // AC -> SVC-AN
      27: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // AL -> SVC-AN
      16: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // AP -> SVC-AN
      13: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',     // AM
      29: 'https://hnfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx', // BA
      23: 'https://nfehom.sefaz.ce.gov.br/nfe4/services/NFeAutorizacao4',          // CE
      53: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // DF -> SVC-AN
      32: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // ES -> SVC-AN
      52: 'https://hom.nfe.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',          // GO
      21: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // MA -> SVC-AN
      51: 'https://homologacao.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4', // MT
      50: 'https://hom.nfe.fazenda.ms.gov.br/NfeAutorizacao4/NFeAutorizacao4.asmx', // MS
      31: 'https://hnfe.fazenda.mg.gov.br/nfe/services/NFeAutorizacao4',            // MG
      15: 'https://appnf.sefa.pa.gov.br/nfe-services/services/NFeAutorizacao4',    // PA
      25: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // PB -> SVC-AN
      41: 'https://homologacao.nfe.fazenda.pr.gov.br/nfe/services/NFeAutorizacao4', // PR
      26: 'https://nfehom.sefaz.pe.gov.br/nfe-service/services/NFeAutorizacao4',   // PE
      22: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // PI -> SVC-AN
      33: 'https://hom.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // RJ -> SVRS
      24: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // RN -> SVC-AN
      43: 'https://hom.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // RS
      11: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // RO -> SVC-AN
      14: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // RR -> SVC-AN
      42: 'https://hom.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // SC -> SVRS
      35: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/NfeAutorizacao4.asmx',     // SP
      28: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // SE -> SVC-AN
      17: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // TO -> SVC-AN
      91: 'https://hom1.nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',  // SVC-AN
      90: 'https://hom.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // SVRS
    },
    prod: {
      12: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // AC -> SVC-AN
      27: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // AL -> SVC-AN
      16: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // AP -> SVC-AN
      13: 'https://nfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',        // AM
      29: 'https://nfe.sefaz.ba.gov.br/webservices/NFeAutorizacao4/NFeAutorizacao4.asmx', // BA
      23: 'https://nfece.sefaz.ce.gov.br/nfe4/services/NFeAutorizacao4',           // CE
      53: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // DF -> SVC-AN
      32: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // ES -> SVC-AN
      52: 'https://nfe.sefaz.go.gov.br/nfe/services/NFeAutorizacao4',              // GO
      21: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // MA -> SVC-AN
      51: 'https://nfe.sefaz.mt.gov.br/nfews/v2/services/NfeAutorizacao4',         // MT
      50: 'https://nfe.fazenda.ms.gov.br/NfeAutorizacao4/NFeAutorizacao4.asmx',    // MS
      31: 'https://nfe.fazenda.mg.gov.br/nfe/services/NFeAutorizacao4',            // MG
      15: 'https://app.sefa.pa.gov.br/nfe/services/NFeAutorizacao4',               // PA
      25: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // PB -> SVC-AN
      41: 'https://nfe.fazenda.pr.gov.br/nfe/services/NFeAutorizacao4',            // PR
      26: 'https://nfe.sefaz.pe.gov.br/nfe-service/services/NFeAutorizacao4',      // PE
      22: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // PI -> SVC-AN
      33: 'https://nfe.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // RJ -> SVRS
      24: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // RN -> SVC-AN
      43: 'https://nfe.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // RS
      11: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // RO -> SVC-AN
      14: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // RR -> SVC-AN
      42: 'https://nfe.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // SC -> SVRS
      35: 'https://nfe.fazenda.sp.gov.br/ws/NfeAutorizacao4.asmx',                 // SP
      28: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // SE -> SVC-AN
      17: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // TO -> SVC-AN
      91: 'https://nfe.fazenda.gov.br/NFeAutorizacao4/NFeAutorizacao4.asmx',       // SVC-AN
      90: 'https://nfe.sefaz.rs.gov.br/ws/NFeAutorizacao/NFeAutorizacao4.asmx',    // SVRS
    },
  },

  // NfeConsultaProtocolo4
  consultaProtocolo: {
    hom: {
      // Most UFs use the national endpoint; specific ones below
      91: 'https://hom1.nfe.fazenda.gov.br/NfeConsultaProtocolo4/NfeConsultaProtocolo4.asmx',
      90: 'https://hom.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      35: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/NfeConsultaProtocolo4.asmx',
      31: 'https://hnfe.fazenda.mg.gov.br/nfe/services/NfeConsultaProtocolo4',
      43: 'https://hom.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      33: 'https://hom.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      42: 'https://hom.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
    },
    prod: {
      91: 'https://nfe.fazenda.gov.br/NfeConsultaProtocolo4/NfeConsultaProtocolo4.asmx',
      90: 'https://nfe.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      35: 'https://nfe.fazenda.sp.gov.br/ws/NfeConsultaProtocolo4.asmx',
      31: 'https://nfe.fazenda.mg.gov.br/nfe/services/NfeConsultaProtocolo4',
      43: 'https://nfe.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      33: 'https://nfe.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
      42: 'https://nfe.sefaz.rs.gov.br/ws/NfeConsultaProtocolo/NfeConsultaProtocolo4.asmx',
    },
  },

  // NfeInutilizacao4
  inutilizacao: {
    hom: {
      91: 'https://hom1.nfe.fazenda.gov.br/NfeInutilizacao4/NfeInutilizacao4.asmx',
      90: 'https://hom.sefaz.rs.gov.br/ws/NfeInutilizacao/NfeInutilizacao4.asmx',
      35: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/NfeInutilizacao4.asmx',
      31: 'https://hnfe.fazenda.mg.gov.br/nfe/services/NfeInutilizacao4',
      43: 'https://hom.sefaz.rs.gov.br/ws/NfeInutilizacao/NfeInutilizacao4.asmx',
    },
    prod: {
      91: 'https://nfe.fazenda.gov.br/NfeInutilizacao4/NfeInutilizacao4.asmx',
      90: 'https://nfe.sefaz.rs.gov.br/ws/NfeInutilizacao/NfeInutilizacao4.asmx',
      35: 'https://nfe.fazenda.sp.gov.br/ws/NfeInutilizacao4.asmx',
      31: 'https://nfe.fazenda.mg.gov.br/nfe/services/NfeInutilizacao4',
      43: 'https://nfe.sefaz.rs.gov.br/ws/NfeInutilizacao/NfeInutilizacao4.asmx',
    },
  },

  // NFeRecepcaoEvento4 (for cancellation and other events)
  recepcaoEvento: {
    hom: {
      91: 'https://hom1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      90: 'https://hom.sefaz.rs.gov.br/ws/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      35: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeRecepcaoEvento4.asmx',
      31: 'https://hnfe.fazenda.mg.gov.br/nfe/services/NFeRecepcaoEvento4',
      43: 'https://hom.sefaz.rs.gov.br/ws/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    },
    prod: {
      91: 'https://nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      90: 'https://nfe.sefaz.rs.gov.br/ws/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
      35: 'https://nfe.fazenda.sp.gov.br/ws/NFeRecepcaoEvento4.asmx',
      31: 'https://nfe.fazenda.mg.gov.br/nfe/services/NFeRecepcaoEvento4',
      43: 'https://nfe.sefaz.rs.gov.br/ws/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
    },
  },

  // NFeStatusServico4
  statusServico: {
    hom: {
      91: 'https://hom1.nfe.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      90: 'https://hom.sefaz.rs.gov.br/ws/NFeStatusServico/NFeStatusServico4.asmx',
      35: 'https://homologacao.nfe.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx',
      31: 'https://hnfe.fazenda.mg.gov.br/nfe/services/NFeStatusServico4',
      43: 'https://hom.sefaz.rs.gov.br/ws/NFeStatusServico/NFeStatusServico4.asmx',
    },
    prod: {
      91: 'https://nfe.fazenda.gov.br/NFeStatusServico4/NFeStatusServico4.asmx',
      90: 'https://nfe.sefaz.rs.gov.br/ws/NFeStatusServico/NFeStatusServico4.asmx',
      35: 'https://nfe.fazenda.sp.gov.br/ws/NFeStatusServico4.asmx',
      31: 'https://nfe.fazenda.mg.gov.br/nfe/services/NFeStatusServico4',
      43: 'https://nfe.sefaz.rs.gov.br/ws/NFeStatusServico/NFeStatusServico4.asmx',
    },
  },
};

// Default national endpoint (SVC-AN) for UFs not explicitly listed
const DEFAULT_HOM_AN = 'https://hom1.nfe.fazenda.gov.br';
const DEFAULT_PROD_AN = 'https://nfe.fazenda.gov.br';

const SERVICE_PATH = {
  autorizacao:      '/NFeAutorizacao4/NFeAutorizacao4.asmx',
  consultaProtocolo:'/NfeConsultaProtocolo4/NfeConsultaProtocolo4.asmx',
  inutilizacao:     '/NfeInutilizacao4/NfeInutilizacao4.asmx',
  recepcaoEvento:   '/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx',
  statusServico:    '/NFeStatusServico4/NFeStatusServico4.asmx',
};

// SEFAZ WSDL namespaces per service
const SERVICE_NAMESPACE = {
  autorizacao:      'http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4',
  consultaProtocolo:'http://www.portalfiscal.inf.br/nfe/wsdl/NfeConsultaProtocolo4',
  inutilizacao:     'http://www.portalfiscal.inf.br/nfe/wsdl/NfeInutilizacao4',
  recepcaoEvento:   'http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4',
  statusServico:    'http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4',
};

/**
 * Returns the SEFAZ webservice endpoint URL for a given service, UF and environment
 * @param {string} service - Service name key
 * @param {string|number} cUF - UF code or 91 (SVC-AN) / 90 (SVRS)
 * @param {boolean} isProduction - true for production, false for homologação
 * @returns {string} Endpoint URL
 */
function getEndpoint(service, cUF, isProduction) {
  const env = isProduction ? 'prod' : 'hom';
  const table = ENDPOINTS[service] && ENDPOINTS[service][env];
  const ufKey = Number(cUF);

  if (table && table[ufKey]) {
    return table[ufKey];
  }

  // Fall back to national SVC-AN endpoint
  const base = isProduction ? DEFAULT_PROD_AN : DEFAULT_HOM_AN;
  return base + (SERVICE_PATH[service] || '');
}

/**
 * Builds a SEFAZ NF-e SOAP 1.2 envelope
 * @param {string} service - Service name key (used to get WSDL namespace)
 * @param {string} bodyXml - XML content to place inside nfeDadosMsg
 * @param {string|number} cUF - UF code (placed in header)
 * @returns {string} Complete SOAP envelope
 */
function buildSoapEnvelope(service, bodyXml, cUF) {
  const ns = SERVICE_NAMESPACE[service];
  // Remove XML declaration from inner payload if present
  const cleanXml = bodyXml.replace(/^<\?xml[^?]*\?>\s*/i, '').trim();

  return (
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap12:Envelope' +
    ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
    ' xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
    '<soap12:Header>' +
    `<nfeCabecMsg xmlns="${ns}">` +
    `<cUF>${cUF}</cUF>` +
    '<versaoDados>4.00</versaoDados>' +
    '</nfeCabecMsg>' +
    '</soap12:Header>' +
    '<soap12:Body>' +
    `<nfeDadosMsg xmlns="${ns}">` +
    cleanXml +
    '</nfeDadosMsg>' +
    '</soap12:Body>' +
    '</soap12:Envelope>'
  );
}

/**
 * Parses a SEFAZ SOAP response envelope and returns the inner XML content
 * @param {string} soapXml - Raw SOAP response XML
 * @returns {Promise<Object>} Parsed inner content as JavaScript object
 */
async function parseSoapResponse(soapXml) {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    const result = await parser.parseStringPromise(soapXml);

    // Navigate through the SOAP envelope
    const envelope = result['Envelope'] || result['soap12:Envelope'] || result;
    const body = envelope['Body'] || envelope['soap12:Body'] || envelope;

    // Find the first key that is the response wrapper (nfeResultMsg or similar)
    const bodyKeys = Object.keys(body || {});
    if (bodyKeys.length === 0) {
      return { raw: soapXml };
    }

    const responseWrapper = body[bodyKeys[0]];
    if (!responseWrapper) {
      return { raw: soapXml };
    }

    // The inner content may be under 'nfeResultMsg' or similar; return what we have
    return responseWrapper;
  } catch (err) {
    // Return the raw XML if parsing fails so the caller always gets something
    return { raw: soapXml, parseError: err.message };
  }
}

/**
 * Generic SEFAZ SOAP request handler
 * @param {Object} options
 * @param {string} options.service - Service key
 * @param {string} options.bodyXml - XML payload
 * @param {string|number} options.cUF - UF code
 * @param {boolean} options.isProduction - Environment flag
 * @param {Buffer} [options.certificateBuffer] - PFX cert for mTLS
 * @param {string} [options.certificatePassword] - PFX password
 * @param {string} [options.endpointOverride] - Custom endpoint URL
 * @returns {Promise<{ parsed: Object, soap: { request: string, response: string } }>}
 */
async function sendSoapRequest(options) {
  const {
    service,
    bodyXml,
    cUF,
    isProduction,
    certificateBuffer,
    certificatePassword,
    endpointOverride,
  } = options;

  const endpoint = endpointOverride || getEndpoint(service, cUF, isProduction);
  const soapEnvelope = buildSoapEnvelope(service, bodyXml, cUF);

  const requestConfig = {
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
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

  let response;
  try {
    response = await axios.post(endpoint, soapEnvelope, requestConfig);
  } catch (networkError) {
    if (networkError.request) {
      throw new Error('Sem resposta do servidor SEFAZ. Verifique a conexão de rede.');
    }
    throw new Error(`Erro ao conectar ao servidor SEFAZ: ${networkError.message}`);
  }

  if (response.status >= 400) {
    if (response.status === 401) {
      throw new Error('Não autorizado (401). Verifique o certificado digital.');
    } else if (response.status === 403) {
      throw new Error('Acesso negado (403). Certificado não autorizado ou IP bloqueado.');
    } else if (response.status === 404) {
      throw new Error(`Serviço SEFAZ não encontrado (404): ${endpoint}`);
    } else if (response.status >= 500) {
      throw new Error(`Erro interno do servidor SEFAZ (${response.status}).`);
    } else {
      throw new Error(`Erro HTTP ${response.status} do servidor SEFAZ.`);
    }
  }

  const parsed = await parseSoapResponse(response.data);

  return {
    parsed,
    soap: {
      request: soapEnvelope,
      response: response.data,
    },
  };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Submits an NF-e for authorization (NFeAutorizacao4)
 * @param {string} enviNFeXml - enviNFe XML
 * @param {string|number} cUF - UF code
 * @param {boolean} isProduction
 * @param {Buffer} certBuffer
 * @param {string} certPassword
 * @param {string} [endpointOverride]
 */
async function autorizacao(enviNFeXml, cUF, isProduction, certBuffer, certPassword, endpointOverride) {
  return sendSoapRequest({
    service: 'autorizacao',
    bodyXml: enviNFeXml,
    cUF,
    isProduction,
    certificateBuffer: certBuffer,
    certificatePassword: certPassword,
    endpointOverride,
  });
}

/**
 * Queries an NF-e by access key (NfeConsultaProtocolo4)
 * @param {string} consSitXml - consSitNFe XML
 * @param {string|number} cUF - UF code
 * @param {boolean} isProduction
 * @param {Buffer} certBuffer
 * @param {string} certPassword
 * @param {string} [endpointOverride]
 */
async function consultaProtocolo(consSitXml, cUF, isProduction, certBuffer, certPassword, endpointOverride) {
  return sendSoapRequest({
    service: 'consultaProtocolo',
    bodyXml: consSitXml,
    cUF,
    isProduction,
    certificateBuffer: certBuffer,
    certificatePassword: certPassword,
    endpointOverride,
  });
}

/**
 * Inutilizes a range of NF-e numbers (NfeInutilizacao4)
 * @param {string} inutNFeXml - Signed inutNFe XML
 * @param {string|number} cUF - UF code
 * @param {boolean} isProduction
 * @param {Buffer} certBuffer
 * @param {string} certPassword
 * @param {string} [endpointOverride]
 */
async function inutilizacao(inutNFeXml, cUF, isProduction, certBuffer, certPassword, endpointOverride) {
  return sendSoapRequest({
    service: 'inutilizacao',
    bodyXml: inutNFeXml,
    cUF,
    isProduction,
    certificateBuffer: certBuffer,
    certificatePassword: certPassword,
    endpointOverride,
  });
}

/**
 * Sends an NF-e event (NFeRecepcaoEvento4) – used for cancellation
 * @param {string} envEventoXml - envEvento XML (signed)
 * @param {string|number} cUF - UF code (or 91 for national)
 * @param {boolean} isProduction
 * @param {Buffer} certBuffer
 * @param {string} certPassword
 * @param {string} [endpointOverride]
 */
async function recepcaoEvento(envEventoXml, cUF, isProduction, certBuffer, certPassword, endpointOverride) {
  return sendSoapRequest({
    service: 'recepcaoEvento',
    bodyXml: envEventoXml,
    cUF,
    isProduction,
    certificateBuffer: certBuffer,
    certificatePassword: certPassword,
    endpointOverride,
  });
}

/**
 * Checks SEFAZ service status (NFeStatusServico4)
 * @param {string} consStatXml - consStatServ XML
 * @param {string|number} cUF - UF code
 * @param {boolean} isProduction
 * @param {Buffer} certBuffer
 * @param {string} certPassword
 * @param {string} [endpointOverride]
 */
async function statusServico(consStatXml, cUF, isProduction, certBuffer, certPassword, endpointOverride) {
  return sendSoapRequest({
    service: 'statusServico',
    bodyXml: consStatXml,
    cUF,
    isProduction,
    certificateBuffer: certBuffer,
    certificatePassword: certPassword,
    endpointOverride,
  });
}

module.exports = {
  autorizacao,
  consultaProtocolo,
  inutilizacao,
  recepcaoEvento,
  statusServico,
  getEndpoint,
};
