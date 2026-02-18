const xml2js = require('xml2js');

/**
 * XML Builder Service for São Paulo NFS-e (v01-1)
 * Builds XML according to PedidoEnvioLoteRPS_v01.xsd schema
 */

/**
 * Builds the PedidoEnvioLoteRPS XML structure
 * @param {Object} data - Batch data containing header and RPS list
 * @param {string} signature - Digital signature of the batch (XML string)
 * @returns {string} XML string
 */
function buildPedidoEnvioLoteRPS(data, signature) {
  const { cabecalho, rps } = data;

  // Build XML object structure according to schema (without signature)
  const xmlObject = {
    'PedidoEnvioLoteRPS': {
      '$': {
        'xmlns': 'http://www.prefeitura.sp.gov.br/nfe',
        'xmlns:tipos': 'http://www.prefeitura.sp.gov.br/nfe/tipos',
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      },
      'Cabecalho': [{
        '$': {
          'Versao': '1',
          'xmlns': '',
        },
        'CPFCNPJRemetente': [buildCPFCNPJ(cabecalho.cpfCnpjRemetente)],
        'transacao': [cabecalho.transacao !== undefined ? cabecalho.transacao : true],
        'dtInicio': [cabecalho.dtInicio],
        'dtFim': [cabecalho.dtFim],
        'QtdRPS': [cabecalho.qtdRPS],
        'ValorTotalServicos': [formatValor(cabecalho.valorTotalServicos)],
        ...(cabecalho.valorTotalDeducoes !== undefined && {
          'ValorTotalDeducoes': [formatValor(cabecalho.valorTotalDeducoes)],
        }),
      }],
      'RPS': rps.map((rpsItem) => ({
        '$': { 'xmlns': '' },
        ...buildRPS(rpsItem),
      })),
    },
  };

  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: false },
  });

  let xmlString = builder.buildObject(xmlObject);
  
  // If signature is provided, insert it before closing tag
  if (signature && signature.trim()) {
    // Remove the closing tag
    xmlString = xmlString.replace('</PedidoEnvioLoteRPS>', '');
    // Add signature and closing tag
    xmlString += signature + '</PedidoEnvioLoteRPS>';
  }
  
  return xmlString;
}

/**
 * Builds CPF/CNPJ structure
 * @param {Object} cpfCnpj - CPF or CNPJ data
 * @returns {Object} XML structure
 */
function buildCPFCNPJ(cpfCnpj) {
  if (cpfCnpj.cnpj) {
    return {
      'CNPJ': [cpfCnpj.cnpj],
    };
  } else if (cpfCnpj.cpf) {
    return {
      'CPF': [cpfCnpj.cpf],
    };
  }
  throw new Error('CPF ou CNPJ é obrigatório');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds RPS structure
 * @param {Object} rpsData - RPS data
 * @returns {Object} XML structure
 */
function buildRPS(rpsData) {
  const rps = {
    'Assinatura': [rpsData.assinatura],
    'ChaveRPS': [buildChaveRPS(rpsData.chaveRPS)],
    'TipoRPS': [rpsData.tipoRPS],
    'DataEmissao': [rpsData.dataEmissao],
    'StatusRPS': [rpsData.statusRPS],
    'TributacaoRPS': [rpsData.tributacaoRPS],
    'ValorServicos': [formatValor(rpsData.valorServicos)],
    'ValorDeducoes': [formatValor(rpsData.valorDeducoes)],
  };

  // Optional fields
  if (rpsData.valorPIS !== undefined) {
    rps['ValorPIS'] = [formatValor(rpsData.valorPIS)];
  }
  if (rpsData.valorCOFINS !== undefined) {
    rps['ValorCOFINS'] = [formatValor(rpsData.valorCOFINS)];
  }
  if (rpsData.valorINSS !== undefined) {
    rps['ValorINSS'] = [formatValor(rpsData.valorINSS)];
  }
  if (rpsData.valorIR !== undefined) {
    rps['ValorIR'] = [formatValor(rpsData.valorIR)];
  }
  if (rpsData.valorCSLL !== undefined) {
    rps['ValorCSLL'] = [formatValor(rpsData.valorCSLL)];
  }

  // Required service fields
  rps['CodigoServico'] = [rpsData.codigoServico];
  rps['AliquotaServicos'] = [formatAliquota(rpsData.aliquotaServicos)];
  rps['ISSRetido'] = [rpsData.issRetido];

  // Tomador (taker) fields
  if (rpsData.cpfCnpjTomador) {
    rps['CPFCNPJTomador'] = [buildCPFCNPJ(rpsData.cpfCnpjTomador)];
  }
  if (rpsData.inscricaoMunicipalTomador) {
    rps['InscricaoMunicipalTomador'] = [rpsData.inscricaoMunicipalTomador];
  }
  if (rpsData.inscricaoEstadualTomador) {
    rps['InscricaoEstadualTomador'] = [rpsData.inscricaoEstadualTomador];
  }
  if (rpsData.razaoSocialTomador) {
    rps['RazaoSocialTomador'] = [rpsData.razaoSocialTomador];
  }
  if (rpsData.enderecoTomador) {
    rps['EnderecoTomador'] = [buildEndereco(rpsData.enderecoTomador)];
  }
  if (rpsData.emailTomador) {
    rps['EmailTomador'] = [rpsData.emailTomador];
  }

  // Intermediario (intermediary) fields
  if (rpsData.cpfCnpjIntermediario) {
    rps['CPFCNPJIntermediario'] = [buildCPFCNPJ(rpsData.cpfCnpjIntermediario)];
  }
  if (rpsData.inscricaoMunicipalIntermediario) {
    rps['InscricaoMunicipalIntermediario'] = [rpsData.inscricaoMunicipalIntermediario];
  }
  if (rpsData.issRetidoIntermediario) {
    rps['ISSRetidoIntermediario'] = [rpsData.issRetidoIntermediario];
  }
  if (rpsData.emailIntermediario) {
    rps['EmailIntermediario'] = [rpsData.emailIntermediario];
  }

  // Service description (required)
  rps['Discriminacao'] = [rpsData.discriminacao];

  // Optional tax burden fields
  if (rpsData.valorCargaTributaria !== undefined) {
    rps['ValorCargaTributaria'] = [formatValor(rpsData.valorCargaTributaria)];
  }
  if (rpsData.percentualCargaTributaria !== undefined) {
    rps['PercentualCargaTributaria'] = [formatPercentual(rpsData.percentualCargaTributaria)];
  }
  if (rpsData.fonteCargaTributaria) {
    rps['FonteCargaTributaria'] = [rpsData.fonteCargaTributaria];
  }

  // Optional construction fields
  if (rpsData.codigoCEI) {
    rps['CodigoCEI'] = [rpsData.codigoCEI];
  }
  if (rpsData.matriculaObra) {
    rps['MatriculaObra'] = [rpsData.matriculaObra];
  }
  if (rpsData.municipioPrestacao) {
    rps['MunicipioPrestacao'] = [rpsData.municipioPrestacao];
  }
  if (rpsData.numeroEncapsulamento) {
    rps['NumeroEncapsulamento'] = [rpsData.numeroEncapsulamento];
  }
  if (rpsData.valorTotalRecebido !== undefined) {
    rps['ValorTotalRecebido'] = [formatValor(rpsData.valorTotalRecebido)];
  }

  return rps;
}

/**
 * Builds ChaveRPS structure
 * @param {Object} chaveRPS - RPS key data
 * @returns {Object} XML structure
 */
function buildChaveRPS(chaveRPS) {
  return {
    'InscricaoPrestador': [chaveRPS.inscricaoPrestador],
    'SerieRPS': [chaveRPS.serieRPS],
    'NumeroRPS': [chaveRPS.numeroRPS],
  };
}

/**
 * Builds Endereco structure
 * @param {Object} endereco - Address data
 * @returns {Object} XML structure
 */
function buildEndereco(endereco) {
  const enderecoObj = {};

  if (endereco.tipoLogradouro) {
    enderecoObj['TipoLogradouro'] = [endereco.tipoLogradouro];
  }
  if (endereco.logradouro) {
    enderecoObj['Logradouro'] = [endereco.logradouro];
  }
  if (endereco.numeroEndereco) {
    enderecoObj['NumeroEndereco'] = [endereco.numeroEndereco];
  }
  if (endereco.complementoEndereco) {
    enderecoObj['ComplementoEndereco'] = [endereco.complementoEndereco];
  }
  if (endereco.bairro) {
    enderecoObj['Bairro'] = [endereco.bairro];
  }
  if (endereco.cidade) {
    enderecoObj['Cidade'] = [endereco.cidade];
  }
  if (endereco.uf) {
    enderecoObj['UF'] = [endereco.uf];
  }
  if (endereco.cep) {
    enderecoObj['CEP'] = [endereco.cep];
  }

  return enderecoObj;
}

/**
 * Builds Signature structure (placeholder for now, will be filled by signature service)
 * @param {string} signatureXml - XML signature string
 * @returns {Object} XML structure
 */
function buildSignature(signatureXml) {
  // This will be replaced with actual signature XML
  return signatureXml;
}

/**
 * Formats monetary value to string with 2 decimal places
 * @param {number} valor - Value to format
 * @returns {string} Formatted value
 */
function formatValor(valor) {
  if (valor === undefined || valor === null) {
    return '0.00';
  }
  return Number(valor).toFixed(2);
}

/**
 * Formats aliquota (tax rate) to string with 4 decimal places
 * @param {number} aliquota - Aliquota to format
 * @returns {string} Formatted aliquota
 */
function formatAliquota(aliquota) {
  if (aliquota === undefined || aliquota === null) {
    return '0.0000';
  }
  return Number(aliquota).toFixed(4);
}

/**
 * Formats percentual to string with 2 decimal places
 * @param {number} percentual - Percentual to format
 * @returns {string} Formatted percentual
 */
function formatPercentual(percentual) {
  if (percentual === undefined || percentual === null) {
    return '0.00';
  }
  return Number(percentual).toFixed(2);
}

/**
 * Builds the PedidoConsultaSituacaoLote XML structure
 * @param {Object} data - Consultation data
 * @param {Object} data.cpfCnpjRemetente - CPF/CNPJ do remetente
 * @param {string} data.numeroProtocolo - Protocolo do lote
 * @returns {string} XML string
 */
function buildPedidoConsultaSituacaoLote(data) {
  const cpfCnpj = data.cpfCnpjRemetente || {};
  const cpfCnpjTag = cpfCnpj.cnpj ? 'CNPJ' : 'CPF';
  const cpfCnpjValue = cpfCnpj.cnpj || cpfCnpj.cpf;

  if (!cpfCnpjValue) {
    throw new Error('CPF ou CNPJ é obrigatório');
  }

  return (
    '<PedidoConsultaSituacaoLote xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:tipos="http://www.prefeitura.sp.gov.br/nfe/tipos">' +
    '<CPFCNPJRemetente xmlns="">' +
    '<' + cpfCnpjTag + '>' + escapeXml(cpfCnpjValue) + '</' + cpfCnpjTag + '>' +
    '</CPFCNPJRemetente>' +
    '<NumeroProtocolo xmlns="">' + escapeXml(data.numeroProtocolo) + '</NumeroProtocolo>' +
    '</PedidoConsultaSituacaoLote>'
  );
}

module.exports = {
  buildPedidoEnvioLoteRPS,
  buildPedidoConsultaSituacaoLote,
};
