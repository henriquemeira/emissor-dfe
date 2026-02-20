const forge = require('node-forge');
const xmlCrypto = require('xml-crypto');

/**
 * NF-e Signature Service
 * Signs NF-e, inutNFe and event (cancellation) XML using XML-DSig
 * with SHA-256 digest and RSA-SHA-256 signature algorithm,
 * as required by SEFAZ for NF-e version 4.00.
 */

/**
 * Extracts the private key and certificate from a PFX/P12 buffer
 * @param {Buffer} certificateBuffer - PFX/P12 file buffer
 * @param {string} password - Certificate password
 * @returns {{ privateKey: Object, certificate: Object }}
 */
function getCertificateAndKey(certificateBuffer, password) {
  try {
    const p12Der = certificateBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags  = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

    if (!certBags[forge.pki.oids.certBag] || certBags[forge.pki.oids.certBag].length === 0) {
      throw new Error('Certificado não encontrado no arquivo PFX');
    }
    if (!keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || keyBags[forge.pki.oids.pkcs8ShroudedKeyBag].length === 0) {
      throw new Error('Chave privada não encontrada no certificado');
    }

    return {
      certificate: certBags[forge.pki.oids.certBag][0].cert,
      privateKey:  keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key,
    };
  } catch (error) {
    throw new Error(`Erro ao extrair certificado e chave: ${error.message}`);
  }
}

/**
 * Signs an XML document using XML-DSig enveloped signature
 * with SHA-256 digest and RSA-SHA-256 signature.
 *
 * The signature element is added as a sibling after the element
 * referenced by refUri (e.g. `#NFe{chaveAcesso}`, `#ID{...}`).
 *
 * @param {string} xml - XML string to sign
 * @param {string} refUri - URI referencing the element to sign (e.g. '#NFe1234...')
 * @param {Buffer} certificateBuffer - PFX/P12 certificate buffer
 * @param {string} password - Certificate password
 * @returns {string} Signed XML string
 */
function signXml(xml, refUri, certificateBuffer, password) {
  try {
    const { privateKey, certificate } = getCertificateAndKey(certificateBuffer, password);

    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/[\r\n]/g, '')
      .trim();

    const sig = new xmlCrypto.SignedXml({ privateKey: privateKeyPem });

    sig.addReference({
      xpath: `//*[@Id="${refUri.replace('#', '')}"]`,
      uri: refUri,
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      ],
    });

    sig.canonicalizationAlgorithm = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
    sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

    sig.keyInfoProvider = {
      getKeyInfo: () => `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`,
    };

    sig.computeSignature(xml);

    return sig.getSignedXml();
  } catch (error) {
    throw new Error(`Erro ao assinar XML NF-e: ${error.message}`);
  }
}

module.exports = {
  signXml,
  getCertificateAndKey,
};
