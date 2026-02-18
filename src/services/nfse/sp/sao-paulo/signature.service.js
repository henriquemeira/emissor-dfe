const forge = require('node-forge');
const xmlCrypto = require('xml-crypto');

/**
 * Signature Service for São Paulo NFS-e
 * Handles digital signature for RPS and batch
 */

/**
 * Signs an individual RPS according to São Paulo specification
 * The signature is based on a 86-character string with specific RPS information
 * 
 * @param {Object} rpsData - RPS data to sign
 * @param {Buffer} certificateBuffer - Certificate file buffer (PFX/P12)
 * @param {string} password - Certificate password
 * @returns {string} Base64 encoded signature
 */
function signRPS(rpsData, certificateBuffer, password) {
  try {
    // Build the string to be signed (86 characters according to spec)
    const stringToSign = buildRPSStringToSign(rpsData);

    
    // Get private key from certificate
    const privateKey = getPrivateKey(certificateBuffer, password);
    
    // Sign the string
    const md = forge.md.sha1.create();
    md.update(stringToSign, 'utf8');
    
    const signature = privateKey.sign(md);
    
    // Return base64 encoded signature
    const signatureBase64 = forge.util.encode64(signature);


    return signatureBase64;
  } catch (error) {
    throw new Error(`Erro ao assinar RPS: ${error.message}`);
  }
}

/**
 * Builds the RPS signature string
 * Format:
 * - Inscrição Municipal (CCM) - 8 characters (zero-padded left)
 * - Série do RPS - 5 characters (space-padded right)
 * - Número do RPS - 12 characters (zero-padded left)
 * - Data de emissão - 8 characters (YYYYMMDD)
 * - Tipo de Tributação - 1 character (T/F/I/J)
 * - Status do RPS - 1 character (N/C/E)
 * - ISS Retido - 1 character (S/N)
 * - Valor dos Serviços - 15 characters (no separators)
 * - Valor das Deduções - 15 characters (no separators)
 * - Código do Serviço - 5 characters
 * - Indicador de CPF/CNPJ - 1 character (1=CPF, 2=CNPJ, 3=Não informado)
 * - CPF/CNPJ do Tomador - 14 characters (zero-padded left)
 * - Indicador de CPF/CNPJ do Intermediario - 1 character (1=CPF, 2=CNPJ, 3=Nao informado)
 * - CPF/CNPJ do Intermediario - 14 characters (zero-padded left)
 * - ISS Retido Intermediario - 1 character (S/N)
 * 
 * @param {Object} rpsData - RPS data
 * @returns {string} Signature string (86 or 102 characters)
 */
function buildRPSStringToSign(rpsData) {
  // 1. Inscrição Municipal (8 characters)
  const inscricao = rpsData.chaveRPS.inscricaoPrestador.toString().padStart(8, '0');
  
  // 2. Série do RPS (5 characters, space-padded right)
  const serie = rpsData.chaveRPS.serieRPS.toString().padEnd(5, ' ');
  
  // 3. Número do RPS (12 characters)
  const numero = rpsData.chaveRPS.numeroRPS.toString().padStart(12, '0');
  
  // 4. Data de emissão (YYYYMMDD)
  const dataEmissao = rpsData.dataEmissao.replace(/-/g, '');
  
  // 5. Tipo de Tributação (1 character: T, F, I, J)
  const tributacao = rpsData.tributacaoRPS;
  
  // 6. Status do RPS (1 character: N, C, E)
  const status = rpsData.statusRPS;
  
  // 7. ISS Retido (1 character: S or N)
  const issRetido = rpsData.issRetido ? 'S' : 'N';
  
  // 8. Valor dos Serviços (15 characters without separators)
  const valorServicos = formatValueForSignature(rpsData.valorServicos);
  
  // 9. Valor das Deduções (15 characters without separators)
  const valorDeducoes = formatValueForSignature(rpsData.valorDeducoes);
  
  // 10. Código do Serviço (5 characters)
  const codigoServico = rpsData.codigoServico.toString().padStart(5, '0');
  
  // 11. Indicador de CPF/CNPJ (1 character: 1=CPF, 2=CNPJ, 3=Não informado)
  let indicadorCpfCnpj = '3'; // Default: não informado
  let cpfCnpjTomador = '00000000000000';
  if (rpsData.cpfCnpjTomador) {
    if (rpsData.cpfCnpjTomador.cnpj) {
      indicadorCpfCnpj = '2';
      cpfCnpjTomador = rpsData.cpfCnpjTomador.cnpj.padStart(14, '0');
    } else if (rpsData.cpfCnpjTomador.cpf) {
      indicadorCpfCnpj = '1';
      cpfCnpjTomador = rpsData.cpfCnpjTomador.cpf.padStart(14, '0');
    }
  }
  
  // 13-15. Intermediario (optional; include only when present)
  const hasIntermediario = Boolean(rpsData.cpfCnpjIntermediario) ||
    rpsData.issRetidoIntermediario === true ||
    rpsData.issRetidoIntermediario === false ||
    (typeof rpsData.issRetidoIntermediario === 'string' && rpsData.issRetidoIntermediario.trim() !== '');

  let indicadorCpfCnpjIntermediario = '3';
  let cpfCnpjIntermediario = '00000000000000';
  if (rpsData.cpfCnpjIntermediario) {
    if (rpsData.cpfCnpjIntermediario.cnpj) {
      indicadorCpfCnpjIntermediario = '2';
      cpfCnpjIntermediario = rpsData.cpfCnpjIntermediario.cnpj.padStart(14, '0');
    } else if (rpsData.cpfCnpjIntermediario.cpf) {
      indicadorCpfCnpjIntermediario = '1';
      cpfCnpjIntermediario = rpsData.cpfCnpjIntermediario.cpf.padStart(14, '0');
    }
  }

  let issRetidoIntermediario = 'N';
  if (typeof rpsData.issRetidoIntermediario === 'string') {
    const normalized = rpsData.issRetidoIntermediario.toUpperCase();
    if (normalized === 'S' || normalized === 'N') {
      issRetidoIntermediario = normalized;
    }
  } else if (rpsData.issRetidoIntermediario === true) {
    issRetidoIntermediario = 'S';
  }

  // Build the signature string
  const stringToSign = 
    inscricao +           // 8
    serie +               // 5
    numero +              // 12
    dataEmissao +         // 8
    tributacao +          // 1
    status +              // 1
    issRetido +           // 1
    valorServicos +       // 15
    valorDeducoes +       // 15
    codigoServico +       // 5
    indicadorCpfCnpj +    // 1
    cpfCnpjTomador +      // 14
    (hasIntermediario
      ? indicadorCpfCnpjIntermediario + cpfCnpjIntermediario + issRetidoIntermediario
      : '');
  // Total: 86 (sem intermediario) ou 102 (com intermediario)
  
  return stringToSign;
}

/**
 * Formats a monetary value for signature (15 characters without separators)
 * @param {number} value - Value to format
 * @returns {string} Formatted value (15 characters)
 */
function formatValueForSignature(value) {
  if (value === undefined || value === null) {
    value = 0;
  }
  // Convert to cents and remove decimal point
  const cents = Math.round(value * 100);
  return cents.toString().padStart(15, '0');
}

/**
 * Signs the XML batch using XML Digital Signature (XML-DSig)
 * Uses xml-crypto library for proper W3C compliant signatures
 * @param {string} xml - XML string to sign
 * @param {Buffer} certificateBuffer - Certificate file buffer (PFX/P12)
 * @param {string} password - Certificate password
 * @returns {Object} Signature object for insertion into XML
 */
function signXMLBatch(xml, certificateBuffer, password) {
  try {
    // Get private key and certificate from PFX
    const { privateKey, certificate } = getCertificateAndKey(certificateBuffer, password);
    
    // Convert private key to PEM format for xml-crypto
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    
    // Create signature using xml-crypto
    const sig = new xmlCrypto.SignedXml({
      privateKey: privateKeyPem,
    });
    
    // Add reference to the document (root element only)
    sig.addReference({
      xpath: '/*',
      uri: '',
      isEmptyUri: true,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ],
    });
    
    // Set canonicalization and signature algorithms
    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    
    // Add key info with certificate
    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '');
    
    sig.keyInfoProvider = {
      getKeyInfo: () => {
        return `<KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo>`;
      },
    };
    
    // Compute signature
    sig.computeSignature(xml);
    
    // Get the signature XML
    const signatureXml = sig.getSignatureXml();
    
    // Parse signature XML to return as object structure
    return parseSignatureXml(signatureXml, certBase64);
  } catch (error) {
    throw new Error(`Erro ao assinar lote XML: ${error.message}`);
  }
}

/**
 * Signs XML batch for synchronous method (isolated implementation)
 * @param {string} xml - XML to sign
 * @param {Buffer} certificateBuffer - Certificate buffer
 * @param {string} password - Certificate password
 * @returns {string} Signature XML fragment
 */
function signXMLBatchSync(xml, certificateBuffer, password) {
  try {
    // Get private key and certificate from PFX
    const { privateKey, certificate } = getCertificateAndKey(certificateBuffer, password);
    
    // Convert private key to PEM format for xml-crypto
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    
    // Create signature using xml-crypto
    const sig = new xmlCrypto.SignedXml({
      privateKey: privateKeyPem,
    });
    
    // Add reference to the document (root element only)
    sig.addReference({
      xpath: '/*',
      uri: '',
      isEmptyUri: true,
      digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
      ],
    });
    
    // Set canonicalization and signature algorithms
    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    
    // Get certificate in base64 format
    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
      .trim();
    
    // DO NOT set keyInfoProvider - we'll add KeyInfo manually after signature
    
    // Compute signature
    sig.computeSignature(xml);
    
    // Get the signature XML (without KeyInfo)
    let signatureXml = sig.getSignatureXml();
    
    // Ensure KeyInfo with certificate is properly added
    // Remove any existing broken KeyInfo tags
    signatureXml = signatureXml.replace(/<KeyInfo>.*?<\/KeyInfo>/g, '');
    
    // Add KeyInfo before closing Signature tag
    const keyInfoXml = `<KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo>`;
    signatureXml = signatureXml.replace('</Signature>', `${keyInfoXml}</Signature>`);
    
    return signatureXml;
  } catch (error) {
    throw new Error(`Erro ao assinar lote XML (síncrono): ${error.message}`);
  }
}

/**
 * Parses signature XML string into object structure
 * @param {string} signatureXml - Signature XML string
 * @returns {string} Signature XML
 */
function parseSignatureXml(signatureXml, certBase64) {
  let finalSignature = signatureXml;

  if (!finalSignature.includes('<KeyInfo>')) {
    const keyInfoXml = `<KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo>`;
    finalSignature = finalSignature.replace('</Signature>', `${keyInfoXml}</Signature>`);
  }

  return finalSignature;
}

/**
 * Gets private key from certificate
 * @param {Buffer} certificateBuffer - Certificate buffer
 * @param {string} password - Certificate password
 * @returns {Object} Private key
 */
function getPrivateKey(certificateBuffer, password) {
  try {
    const p12Der = certificateBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    
    const pkcs8ShroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    
    if (!pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || 
        pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
      throw new Error('Chave privada não encontrada no certificado');
    }
    
    return pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
  } catch (error) {
    throw new Error(`Erro ao extrair chave privada: ${error.message}`);
  }
}

/**
 * Gets certificate and private key from PFX
 * @param {Buffer} certificateBuffer - Certificate buffer
 * @param {string} password - Certificate password
 * @returns {Object} Certificate and private key
 */
function getCertificateAndKey(certificateBuffer, password) {
  try {
    const p12Der = certificateBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const pkcs8ShroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    
    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
      throw new Error('Certificado não encontrado no arquivo PFX');
    }
    
    if (!pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || 
        pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
      throw new Error('Chave privada não encontrada no certificado');
    }
    
    const certificate = certBags[forge.pki.oids.certBag][0].cert;
    const privateKey = pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
    
    return { certificate, privateKey };
  } catch (error) {
    throw new Error(`Erro ao extrair certificado e chave: ${error.message}`);
  }
}

/**
 * Signs cancellation for an individual NFSe according to São Paulo specification
 * The signature is based on a 20-character string with NFSe information
 * 
 * @param {Object} chaveNFe - NFe key data to sign
 * @param {Buffer} certificateBuffer - Certificate file buffer (PFX/P12)
 * @param {string} password - Certificate password
 * @returns {string} Base64 encoded signature
 */
function signCancelamento(chaveNFe, certificateBuffer, password) {
  try {
    // Build the string to be signed (20 characters according to spec)
    const stringToSign = buildCancelamentoStringToSign(chaveNFe);

    // Get private key from certificate
    const privateKey = getPrivateKey(certificateBuffer, password);
    
    // Sign the string
    const md = forge.md.sha1.create();
    md.update(stringToSign, 'utf8');
    
    const signature = privateKey.sign(md);
    
    // Return base64 encoded signature
    const signatureBase64 = forge.util.encode64(signature);

    return signatureBase64;
  } catch (error) {
    throw new Error(`Erro ao assinar cancelamento: ${error.message}`);
  }
}

/**
 * Builds the cancellation signature string
 * Format:
 * - Inscrição Municipal (CCM) - 8 characters (zero-padded left)
 * - Número da NFS-e - 12 characters (zero-padded left)
 * 
 * @param {Object} chaveNFe - NFe key data
 * @returns {string} Signature string (20 characters)
 */
function buildCancelamentoStringToSign(chaveNFe) {
  // 1. Inscrição Municipal (8 characters)
  const inscricao = chaveNFe.inscricaoPrestador.toString().padStart(8, '0');
  
  // 2. Número da NFS-e (12 characters)
  const numeroNFe = chaveNFe.numeroNFe.toString().padStart(12, '0');
  
  const stringToSign = inscricao + numeroNFe;
  
  // Validate length
  if (stringToSign.length !== 20) {
    throw new Error(`String de assinatura de cancelamento inválida. Esperado 20 caracteres, obtido ${stringToSign.length}`);
  }
  
  return stringToSign;
}

module.exports = {
  signRPS,
  signXMLBatch,
  signXMLBatchSync,
  buildRPSStringToSign,
  signCancelamento,
  buildCancelamentoStringToSign,
};
