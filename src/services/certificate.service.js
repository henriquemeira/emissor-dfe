const forge = require('node-forge');

/**
 * Validates and extracts information from a PFX/P12 certificate
 * @param {Buffer} certificateBuffer - Certificate file buffer
 * @param {string} password - Certificate password
 * @returns {Object} Certificate information
 */
function validateCertificate(certificateBuffer, password) {
  try {
    // Convert buffer to binary string for node-forge
    const p12Der = forge.util.binary.raw.decode(certificateBuffer);
    
    // Parse PKCS#12
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    
    // Get certificate bags
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const pkcs8ShroudedKeyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    
    // Check if we have certificate and private key
    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
      throw new Error('No certificate found in PFX file');
    }
    
    if (!pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || 
        pkcs8ShroudedKeyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
      throw new Error('No private key found in PFX file');
    }
    
    // Get the first certificate
    const certBag = certBags[forge.pki.oids.certBag][0];
    const certificate = certBag.cert;
    
    // Extract subject information
    const subject = certificate.subject;
    const issuer = certificate.issuer;
    
    // Extract CNPJ from subject
    const cnpj = extractCNPJ(certificate);
    if (!cnpj) {
      throw new Error('Could not extract CNPJ from certificate');
    }
    
    // Extract company name (Razão Social)
    const razaoSocial = extractRazaoSocial(subject);
    
    // Check validity dates
    const now = new Date();
    const notBefore = certificate.validity.notBefore;
    const notAfter = certificate.validity.notAfter;
    
    if (now < notBefore) {
      throw new Error('Certificate is not yet valid');
    }
    
    if (now > notAfter) {
      throw new Error('Certificate has expired');
    }
    
    return {
      valid: true,
      cnpj,
      razaoSocial,
      validade: notAfter.toISOString(),
      issuer: getIssuerName(issuer),
      serialNumber: certificate.serialNumber,
    };
  } catch (error) {
    if (error.message.includes('Invalid password')) {
      throw new Error('INVALID_PASSWORD');
    }
    if (error.message.includes('expired')) {
      throw new Error('CERTIFICATE_EXPIRED');
    }
    throw new Error(`INVALID_CERTIFICATE: ${error.message}`);
  }
}

/**
 * Extracts CNPJ from certificate
 * @param {Object} certificate - Forge certificate object
 * @returns {string|null} CNPJ or null
 */
function extractCNPJ(certificate) {
  const subject = certificate.subject;
  
  // Try to find CNPJ in serialNumber field
  const serialNumberAttr = subject.getField({ name: 'serialNumber' });
  if (serialNumberAttr && serialNumberAttr.value) {
    const cnpj = serialNumberAttr.value.replace(/\D/g, '');
    if (cnpj.length === 14) {
      return cnpj;
    }
  }
  
  // Try to extract from subject alternative names
  const altNames = certificate.getExtension({ name: 'subjectAltName' });
  if (altNames && altNames.altNames) {
    for (const altName of altNames.altNames) {
      if (altName.value) {
        const cnpj = altName.value.replace(/\D/g, '');
        if (cnpj.length === 14) {
          return cnpj;
        }
      }
    }
  }
  
  // Try to extract from CN (Common Name)
  const cnAttr = subject.getField({ name: 'commonName' });
  if (cnAttr && cnAttr.value) {
    const cnpjMatch = cnAttr.value.match(/\d{14}/);
    if (cnpjMatch) {
      return cnpjMatch[0];
    }
  }
  
  return null;
}

/**
 * Extracts company name (Razão Social) from subject
 * @param {Object} subject - Certificate subject
 * @returns {string} Company name
 */
function extractRazaoSocial(subject) {
  // Try common name first
  const cnAttr = subject.getField({ name: 'commonName' });
  if (cnAttr && cnAttr.value) {
    // Remove CNPJ if present in CN
    const name = cnAttr.value.replace(/:\d{14}/, '').trim();
    if (name) return name;
  }
  
  // Try organization name
  const oAttr = subject.getField({ name: 'organizationName' });
  if (oAttr && oAttr.value) {
    return oAttr.value;
  }
  
  return 'Nome não encontrado';
}

/**
 * Gets issuer name from certificate
 * @param {Object} issuer - Certificate issuer
 * @returns {string} Issuer name
 */
function getIssuerName(issuer) {
  const cnAttr = issuer.getField({ name: 'commonName' });
  if (cnAttr && cnAttr.value) {
    return cnAttr.value;
  }
  
  const oAttr = issuer.getField({ name: 'organizationName' });
  if (oAttr && oAttr.value) {
    return oAttr.value;
  }
  
  return 'Unknown';
}

/**
 * Formats CNPJ with mask
 * @param {string} cnpj - CNPJ without formatting
 * @returns {string} Formatted CNPJ
 */
function formatCNPJ(cnpj) {
  if (!cnpj || cnpj.length !== 14) return cnpj;
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

module.exports = {
  validateCertificate,
  extractCNPJ,
  formatCNPJ,
};
