const forge = require('node-forge');

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
    return forge.util.encode64(signature);
  } catch (error) {
    throw new Error(`Erro ao assinar RPS: ${error.message}`);
  }
}

/**
 * Builds the 86-character string for RPS signature
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
 * - CPF/CNPJ do Tomador - 14 characters (zero-padded left)
 * 
 * @param {Object} rpsData - RPS data
 * @returns {string} 86-character string
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
  
  // 11. CPF/CNPJ do Tomador (14 characters)
  let cpfCnpjTomador = '00000000000000'; // Default if not informed
  if (rpsData.cpfCnpjTomador) {
    if (rpsData.cpfCnpjTomador.cnpj) {
      cpfCnpjTomador = rpsData.cpfCnpjTomador.cnpj.padStart(14, '0');
    } else if (rpsData.cpfCnpjTomador.cpf) {
      cpfCnpjTomador = rpsData.cpfCnpjTomador.cpf.padStart(14, '0');
    }
  }
  
  // Build the 86-character string
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
    cpfCnpjTomador;       // 14
  // Total: 86
  
  if (stringToSign.length !== 86) {
    throw new Error(`String de assinatura inválida. Esperado 86 caracteres, obtido ${stringToSign.length}`);
  }
  
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
 * Signs the XML batch using XML Digital Signature
 * @param {string} xml - XML string to sign
 * @param {Buffer} certificateBuffer - Certificate file buffer (PFX/P12)
 * @param {string} password - Certificate password
 * @returns {string} Signed XML
 */
function signXMLBatch(xml, certificateBuffer, password) {
  try {
    // Get private key and certificate from PFX
    const { privateKey, certificate } = getCertificateAndKey(certificateBuffer, password);
    
    // This is a simplified version - in production, you would use a proper XML-DSig library
    // For now, we'll create a basic signature structure
    const signature = createXMLSignature(xml, privateKey, certificate);
    
    return signature;
  } catch (error) {
    throw new Error(`Erro ao assinar lote XML: ${error.message}`);
  }
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
 * Creates XML Digital Signature structure
 * @param {string} xml - XML to sign
 * @param {Object} privateKey - Private key
 * @param {Object} certificate - Certificate
 * @returns {Object} Signature object
 */
function createXMLSignature(xml, privateKey, certificate) {
  // Create signature
  const md = forge.md.sha1.create();
  md.update(xml, 'utf8');
  const signature = privateKey.sign(md);
  
  // Build signature structure according to XML-DSig spec
  const signatureValue = forge.util.encode64(signature);
  const certPem = forge.pki.certificateToPem(certificate);
  const certBase64 = certPem
    .replace('-----BEGIN CERTIFICATE-----', '')
    .replace('-----END CERTIFICATE-----', '')
    .replace(/\n/g, '');
  
  return {
    'SignedInfo': [{
      'CanonicalizationMethod': [{
        '$': { 'Algorithm': 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' },
      }],
      'SignatureMethod': [{
        '$': { 'Algorithm': 'http://www.w3.org/2000/09/xmldsig#rsa-sha1' },
      }],
      'Reference': [{
        '$': { 'URI': '' },
        'Transforms': [{
          'Transform': [
            { '$': { 'Algorithm': 'http://www.w3.org/2000/09/xmldsig#enveloped-signature' } },
            { '$': { 'Algorithm': 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315' } },
          ],
        }],
        'DigestMethod': [{
          '$': { 'Algorithm': 'http://www.w3.org/2000/09/xmldsig#sha1' },
        }],
        'DigestValue': [forge.util.encode64(md.digest().bytes())],
      }],
    }],
    'SignatureValue': [signatureValue],
    'KeyInfo': [{
      'X509Data': [{
        'X509Certificate': [certBase64],
      }],
    }],
  };
}

module.exports = {
  signRPS,
  signXMLBatch,
  buildRPSStringToSign,
};
