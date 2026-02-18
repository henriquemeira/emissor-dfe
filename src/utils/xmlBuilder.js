const crypto = require('crypto');
const forge = require('node-forge');

/**
 * XML Builder for NFS-e São Paulo
 * Generates XML for RPS batch submission
 */
class XmlBuilder {
  /**
   * Build PedidoEnvioLoteRPS XML (v01-1 async)
   * @param {Object} data - RPS batch data
   * @param {string} cnpj - CNPJ from certificate
   * @param {Buffer} certificateBuffer - Certificate buffer (PFX)
   * @param {string} certificatePassword - Certificate password
   * @returns {string} Signed XML string
   */
  static buildPedidoEnvioLoteRPS(data, cnpj, certificateBuffer, certificatePassword) {
    // Validate version
    if (data.versao !== 'v01-1') {
      throw new Error('layout não suportado');
    }

    // Extract header and RPS list
    const { cabecalho, rps } = data;
    
    // Build XML structure
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" ';
    xml += 'xmlns:tipos="http://www.prefeitura.sp.gov.br/nfe/tipos" ';
    xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
    
    // Cabecalho
    xml += `  <Cabecalho Versao="1">\n`;
    xml += `    <CPFCNPJRemetente>${this.cleanCNPJ(cnpj)}</CPFCNPJRemetente>\n`;
    xml += `    <transacao>${cabecalho.transacao !== false}</transacao>\n`;
    xml += `    <dtInicio>${cabecalho.dtInicio}</dtInicio>\n`;
    xml += `    <dtFim>${cabecalho.dtFim}</dtFim>\n`;
    xml += `    <QtdRPS>${rps.length}</QtdRPS>\n`;
    xml += `  </Cabecalho>\n`;
    
    // RPS list
    rps.forEach((rpsItem) => {
      xml += this.buildRPS(rpsItem, cnpj, certificateBuffer, certificatePassword);
    });
    
    xml += '</PedidoEnvioLoteRPS>';
    
    // Sign the entire XML
    return this.signXML(xml, certificateBuffer, certificatePassword);
  }

  /**
   * Build single RPS XML element
   * @param {Object} rps - RPS data
   * @param {string} ccm - CCM (Inscrição Municipal)
   * @param {Buffer} certificateBuffer - Certificate buffer
   * @param {string} certificatePassword - Certificate password
   * @returns {string} RPS XML fragment
   */
  static buildRPS(rps, cnpj, certificateBuffer, certificatePassword) {
    const ccm = rps.chaveRps.inscricaoPrestador;
    
    // Build signature string for RPS
    const signatureString = this.buildRPSSignatureString(rps, ccm);
    const signature = this.signRPSString(signatureString, certificateBuffer, certificatePassword);
    
    let xml = '  <RPS>\n';
    xml += `    <Assinatura>${signature}</Assinatura>\n`;
    
    // ChaveRPS
    xml += '    <ChaveRPS>\n';
    xml += `      <InscricaoPrestador>${ccm}</InscricaoPrestador>\n`;
    xml += `      <SerieRPS>${rps.chaveRps.serieRps}</SerieRPS>\n`;
    xml += `      <NumeroRPS>${rps.chaveRps.numeroRps}</NumeroRPS>\n`;
    xml += '    </ChaveRPS>\n';
    
    xml += `    <TipoRPS>${rps.tipoRps || 'RPS'}</TipoRPS>\n`;
    xml += `    <DataEmissao>${rps.dataEmissao}</DataEmissao>\n`;
    xml += `    <StatusRPS>${rps.statusRps || 'N'}</StatusRPS>\n`;
    xml += `    <TributacaoRPS>${rps.tributacaoRps}</TributacaoRPS>\n`;
    xml += `    <ValorServicos>${this.formatValue(rps.valorServicos)}</ValorServicos>\n`;
    xml += `    <ValorDeducoes>${this.formatValue(rps.valorDeducoes || 0)}</ValorDeducoes>\n`;
    xml += `    <ValorPIS>${this.formatValue(rps.valorPis || 0)}</ValorPIS>\n`;
    xml += `    <ValorCOFINS>${this.formatValue(rps.valorCofins || 0)}</ValorCOFINS>\n`;
    xml += `    <ValorINSS>${this.formatValue(rps.valorInss || 0)}</ValorINSS>\n`;
    xml += `    <ValorIR>${this.formatValue(rps.valorIr || 0)}</ValorIR>\n`;
    xml += `    <ValorCSLL>${this.formatValue(rps.valorCsll || 0)}</ValorCSLL>\n`;
    xml += `    <CodigoServico>${rps.codigoServico}</CodigoServico>\n`;
    xml += `    <AliquotaServicos>${this.formatAliquota(rps.aliquotaServicos)}</AliquotaServicos>\n`;
    xml += `    <ISSRetido>${rps.issRetido ? 'true' : 'false'}</ISSRetido>\n`;
    
    // Tomador (optional)
    if (rps.cpfCnpjTomador) {
      xml += `    <CPFCNPJTomador>${this.cleanCNPJ(rps.cpfCnpjTomador)}</CPFCNPJTomador>\n`;
    }
    if (rps.inscricaoMunicipalTomador) {
      xml += `    <InscricaoMunicipalTomador>${rps.inscricaoMunicipalTomador}</InscricaoMunicipalTomador>\n`;
    }
    if (rps.inscricaoEstadualTomador) {
      xml += `    <InscricaoEstadualTomador>${rps.inscricaoEstadualTomador}</InscricaoEstadualTomador>\n`;
    }
    if (rps.razaoSocialTomador) {
      xml += `    <RazaoSocialTomador>${this.escapeXml(rps.razaoSocialTomador)}</RazaoSocialTomador>\n`;
    }
    
    // Endereco Tomador (optional)
    if (rps.enderecoTomador) {
      xml += this.buildEnderecoTomador(rps.enderecoTomador);
    }
    
    if (rps.emailTomador) {
      xml += `    <EmailTomador>${this.escapeXml(rps.emailTomador)}</EmailTomador>\n`;
    }
    
    xml += `    <Discriminacao>${this.escapeXml(rps.discriminacao)}</Discriminacao>\n`;
    xml += '  </RPS>\n';
    
    return xml;
  }

  /**
   * Build endereco tomador XML fragment
   */
  static buildEnderecoTomador(endereco) {
    let xml = '    <EnderecoTomador>\n';
    if (endereco.tipoLogradouro) {
      xml += `      <TipoLogradouro>${this.escapeXml(endereco.tipoLogradouro)}</TipoLogradouro>\n`;
    }
    xml += `      <Logradouro>${this.escapeXml(endereco.logradouro)}</Logradouro>\n`;
    xml += `      <NumeroEndereco>${this.escapeXml(endereco.numeroEndereco)}</NumeroEndereco>\n`;
    if (endereco.complementoEndereco) {
      xml += `      <ComplementoEndereco>${this.escapeXml(endereco.complementoEndereco)}</ComplementoEndereco>\n`;
    }
    xml += `      <Bairro>${this.escapeXml(endereco.bairro)}</Bairro>\n`;
    xml += `      <Cidade>${endereco.cidade}</Cidade>\n`;
    xml += `      <UF>${endereco.uf}</UF>\n`;
    xml += `      <CEP>${endereco.cep}</CEP>\n`;
    xml += '    </EnderecoTomador>\n';
    return xml;
  }

  /**
   * Build RPS signature string (86 characters as per documentation)
   * Format: CCM(8) + Serie(5) + Numero(12) + Data(8) + Tributacao(1) + Status(1) + ISS(1) + Valor(15) + Deducoes(15) + Codigo(5) + CPF/CNPJ(14)
   */
  static buildRPSSignatureString(rps, ccm) {
    const ccmPadded = ccm.toString().padStart(8, '0');
    const seriePadded = rps.chaveRps.serieRps.padEnd(5, ' ');
    const numeroPadded = rps.chaveRps.numeroRps.toString().padStart(12, '0');
    const data = rps.dataEmissao.replace(/-/g, ''); // YYYYMMDD
    const tributacao = rps.tributacaoRps;
    const status = rps.statusRps || 'N';
    const issRetido = rps.issRetido ? 'S' : 'N';
    const valorServicos = Math.round(parseFloat(rps.valorServicos) * 100).toString().padStart(15, '0');
    const valorDeducoes = Math.round((parseFloat(rps.valorDeducoes) || 0) * 100).toString().padStart(15, '0');
    const codigoServico = rps.codigoServico.toString().padStart(5, '0');
    
    // CPF/CNPJ do tomador (14 digits, zero if not provided)
    let cpfCnpj = '00000000000000';
    if (rps.cpfCnpjTomador) {
      cpfCnpj = this.cleanCNPJ(rps.cpfCnpjTomador).padStart(14, '0');
    }
    
    return ccmPadded + seriePadded + numeroPadded + data + tributacao + status + issRetido + 
           valorServicos + valorDeducoes + codigoServico + cpfCnpj;
  }

  /**
   * Sign RPS signature string using certificate
   */
  static signRPSString(signatureString, certificateBuffer, certificatePassword) {
    try {
      const p12Asn1 = forge.asn1.fromDer(certificateBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);
      
      // Get private key
      const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
      const privateKey = bag.key;
      
      // Sign using SHA1 with RSA (as per NFe standard)
      const md = forge.md.sha1.create();
      md.update(signatureString, 'utf8');
      const signature = privateKey.sign(md);
      
      // Return base64 encoded signature
      return forge.util.encode64(signature);
    } catch (error) {
      throw new Error(`Erro ao assinar RPS: ${error.message}`);
    }
  }

  /**
   * Sign complete XML document
   */
  static signXML(xml, certificateBuffer, certificatePassword) {
    try {
      const p12Asn1 = forge.asn1.fromDer(certificateBuffer.toString('binary'));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificatePassword);
      
      // Get private key and certificate
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
      
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certificate = certBags[forge.pki.oids.certBag][0].cert;
      
      // Create signature
      const md = forge.md.sha1.create();
      md.update(xml, 'utf8');
      const signature = privateKey.sign(md);
      const signatureB64 = forge.util.encode64(signature);
      
      // Get certificate in PEM format
      const certPem = forge.pki.certificateToPem(certificate);
      const certB64 = certPem
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '');
      
      // Build Signature element
      let signatureXml = '\n  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">\n';
      signatureXml += '    <SignedInfo>\n';
      signatureXml += '      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>\n';
      signatureXml += '      <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>\n';
      signatureXml += '      <Reference URI="">\n';
      signatureXml += '        <Transforms>\n';
      signatureXml += '          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>\n';
      signatureXml += '        </Transforms>\n';
      signatureXml += '        <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>\n';
      signatureXml += `        <DigestValue>${this.calculateDigest(xml)}</DigestValue>\n`;
      signatureXml += '      </Reference>\n';
      signatureXml += '    </SignedInfo>\n';
      signatureXml += `    <SignatureValue>${signatureB64}</SignatureValue>\n`;
      signatureXml += '    <KeyInfo>\n';
      signatureXml += '      <X509Data>\n';
      signatureXml += `        <X509Certificate>${certB64}</X509Certificate>\n`;
      signatureXml += '      </X509Data>\n';
      signatureXml += '    </KeyInfo>\n';
      signatureXml += '  </Signature>\n';
      
      // Insert signature before closing tag
      const signedXml = xml.replace('</PedidoEnvioLoteRPS>', signatureXml + '</PedidoEnvioLoteRPS>');
      
      return signedXml;
    } catch (error) {
      throw new Error(`Erro ao assinar XML: ${error.message}`);
    }
  }

  /**
   * Calculate SHA1 digest of XML
   */
  static calculateDigest(xml) {
    const md = forge.md.sha1.create();
    md.update(xml, 'utf8');
    return forge.util.encode64(md.digest().bytes());
  }

  /**
   * Format monetary value (2 decimal places)
   */
  static formatValue(value) {
    return parseFloat(value).toFixed(2);
  }

  /**
   * Format aliquota (4 decimal places)
   */
  static formatAliquota(value) {
    return parseFloat(value).toFixed(4);
  }

  /**
   * Clean CNPJ/CPF (remove formatting)
   */
  static cleanCNPJ(cnpj) {
    return cnpj.replace(/[^\d]/g, '');
  }

  /**
   * Escape XML special characters
   */
  static escapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

module.exports = XmlBuilder;
