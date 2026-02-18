#!/usr/bin/env node
/**
 * Script de Debug e Teste do Parsing de ResultadoOperacao
 * 
 * Testa a função parseResultadoOperacaoXml com diferentes estruturas de XML
 */

const xml2js = require('xml2js');

// Simular a função de debug
const DEBUG_NFSE_SP = true;

function logDebug(message, ...args) {
  if (DEBUG_NFSE_SP) {
    console.log('  [DEBUG]', message, ...args);
  }
}

function logErrorDebug(message, ...args) {
  if (DEBUG_NFSE_SP) {
    console.error('  [ERROR]', message, ...args);
  }
}

/**
 * Parse um objeto XML com suporte a diferentes estruturas de namespace
 */
function getXmlValue(obj, key) {
  if (!obj) return null;
  
  if (Array.isArray(obj)) {
    return getXmlValue(obj[0], key);
  }
  
  if (obj[key]) {
    return obj[key];
  }
  
  for (const objKey in obj) {
    if (objKey.endsWith(`:${key}`) || objKey === key) {
      return obj[objKey];
    }
  }
  
  return null;
}

/**
 * Simula a função parseResultadoOperacaoXml
 */
async function parseResultadoOperacaoXml(resultadoXmlString) {
  try {
    if (!resultadoXmlString) {
      return null;
    }

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      removeNamespaces: true,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    });

    const parsed = await parser.parseStringPromise(resultadoXmlString);
    
    logDebug('=== RESULTADO OPERACAO XML PARSEADO ===');
    logDebug(JSON.stringify(parsed, null, 2));
    logDebug('=== FIM RESULTADO OPERACAO ===');
    
    let root = parsed.RetornoEnvioLoteRPS;
    if (!root) {
      root = parsed;
    }

    logDebug('Root element encontrado:', Object.keys(root || {}));

    const resultado = {
      cabecalho: null,
      alertas: [],
      erros: [],
      chavesNFeRPS: [],
    };

    // Parse Cabecalho
    const cabecalho = getXmlValue(root, 'Cabecalho');
    if (cabecalho) {
      const sucesso = getXmlValue(cabecalho, 'Sucesso');
      const versao = cabecalho.$?.Versao;
      
      resultado.cabecalho = {
        sucesso: sucesso === 'true' || sucesso === true,
        versao: versao ? parseInt(versao, 10) : null,
      };

      const infLote = getXmlValue(cabecalho, 'InformacoesLote');
      if (infLote) {
        resultado.cabecalho.informacoesLote = {
          numeroLote: getXmlValue(infLote, 'NumeroLote'),
          inscricaoPrestador: getXmlValue(infLote, 'InscricaoPrestador'),
          cpfCnpjRemetente: null,
          dataEnvioLote: getXmlValue(infLote, 'DataEnvioLote'),
          qtdNotasProcessadas: (() => {
            const val = getXmlValue(infLote, 'QtdNotasProcessadas');
            return val ? parseInt(val, 10) : null;
          })(),
          tempoProcessamento: (() => {
            const val = getXmlValue(infLote, 'TempoProcessamento');
            return val ? parseInt(val, 10) : null;
          })(),
          valorTotalServicos: (() => {
            const val = getXmlValue(infLote, 'ValorTotalServicos');
            return val ? parseFloat(val) : null;
          })(),
          valorTotalDeducoes: (() => {
            const val = getXmlValue(infLote, 'ValorTotalDeducoes');
            return val ? parseFloat(val) : null;
          })(),
        };

        const cpfCnpj = getXmlValue(infLote, 'CPFCNPJRemetente');
        if (cpfCnpj) {
          resultado.cabecalho.informacoesLote.cpfCnpjRemetente = {
            cnpj: getXmlValue(cpfCnpj, 'CNPJ'),
            cpf: getXmlValue(cpfCnpj, 'CPF'),
          };
        }
      }
    } else {
      logDebug('Cabecalho não encontrado');
    }

    // Parse Alertas
    const alertas = getXmlValue(root, 'Alerta');
    if (alertas) {
      const alertasArray = Array.isArray(alertas) ? alertas : [alertas];
      alertasArray.forEach(alerta => {
        resultado.alertas.push({
          codigo: getXmlValue(alerta, 'Codigo'),
          descricao: getXmlValue(alerta, 'Descricao'),
        });
      });
    }

    // Parse Erros
    const erros = getXmlValue(root, 'Erro');
    if (erros) {
      const errosArray = Array.isArray(erros) ? erros : [erros];
      errosArray.forEach(erro => {
        resultado.erros.push({
          codigo: getXmlValue(erro, 'Codigo'),
          descricao: getXmlValue(erro, 'Descricao'),
        });
      });
    }

    // Parse ChaveNFeRPS
    const chaves = getXmlValue(root, 'ChaveNFeRPS');
    
    logDebug('ChaveNFeRPS encontrado:', !!chaves);
    if (chaves) {
      const chavesArray = Array.isArray(chaves) ? chaves : [chaves];
      logDebug('Quantidade de chaves:', chavesArray.length);
      logDebug('Estrutura de chaves:', JSON.stringify(chavesArray, null, 2));
      
      chavesArray.forEach((chave, idx) => {
        logDebug(`Processando chave[${idx}]:`, Object.keys(chave));
        
        const chaveNFeRPS = {
          inscricaoPrestador: null,
          numeroNFe: null,
          codigoVerificacao: null,
          chaveRPS: null,
        };

        const chaveNFe = getXmlValue(chave, 'ChaveNFe');
        if (chaveNFe) {
          chaveNFeRPS.inscricaoPrestador = getXmlValue(chaveNFe, 'InscricaoPrestador');
          chaveNFeRPS.numeroNFe = getXmlValue(chaveNFe, 'NumeroNFe');
          chaveNFeRPS.codigoVerificacao = getXmlValue(chaveNFe, 'CodigoVerificacao');
          logDebug(`Chave ${idx} - ChaveNFe encontrada:`, chaveNFeRPS);
        }

        const chaveRPS = getXmlValue(chave, 'ChaveRPS');
        if (chaveRPS) {
          chaveNFeRPS.chaveRPS = {
            inscricaoPrestador: getXmlValue(chaveRPS, 'InscricaoPrestador'),
            serieRPS: getXmlValue(chaveRPS, 'SerieRPS'),
            numeroRPS: getXmlValue(chaveRPS, 'NumeroRPS'),
          };
          logDebug(`Chave ${idx} - ChaveRPS encontrada:`, chaveNFeRPS.chaveRPS);
        }

        resultado.chavesNFeRPS.push(chaveNFeRPS);
      });
    } else {
      logDebug('ChaveNFeRPS não encontrado em root. Chaves disponíveis:', Object.keys(root || {}));
    }

    logDebug('Resultado final parseado:', JSON.stringify(resultado, null, 2));

    return resultado;
  } catch (error) {
    logErrorDebug('Erro ao parsear ResultadoOperacao:', error.message);
    logErrorDebug('Stack:', error.stack);
    return null;
  }
}

// XML de teste do usuário
const sampleXml = `<?xml version="1.0" encoding="utf-8"?>
<RetornoEnvioLoteRPS xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho Versao="1" xmlns="">
    <Sucesso>true</Sucesso>
    <InformacoesLote>
      <NumeroLote>1677901786</NumeroLote>
      <InscricaoPrestador>78709806</InscricaoPrestador>
      <CPFCNPJRemetente>
        <CNPJ>52507723000185</CNPJ>
      </CPFCNPJRemetente>
      <DataEnvioLote>2026-02-18T19:29:43</DataEnvioLote>
      <QtdNotasProcessadas>1</QtdNotasProcessadas>
      <TempoProcessamento>0</TempoProcessamento>
      <ValorTotalServicos>1000</ValorTotalServicos>
    </InformacoesLote>
  </Cabecalho>
  <ChaveNFeRPS xmlns="">
    <ChaveNFe>
      <InscricaoPrestador>78709806</InscricaoPrestador>
      <NumeroNFe>511</NumeroNFe>
      <CodigoVerificacao>S2V8TLWN</CodigoVerificacao>
    </ChaveNFe>
    <ChaveRPS>
      <InscricaoPrestador>78709806</InscricaoPrestador>
      <SerieRPS>1</SerieRPS>
      <NumeroRPS>5</NumeroRPS>
    </ChaveRPS>
  </ChaveNFeRPS>
</RetornoEnvioLoteRPS>`;

/**
 * Rodar teste
 */
async function runTest() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   Teste de Parsing - ResultadoOperacao XML                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('XML de Entrada:');
  console.log('─'.repeat(66));
  console.log(sampleXml);
  console.log('─'.repeat(66));

  console.log('\n📊 Parseando XML...\n');
  const resultado = await parseResultadoOperacaoXml(sampleXml);

  console.log('\n📈 Resultado Final:');
  console.log('─'.repeat(66));
  console.log(JSON.stringify(resultado, null, 2));
  console.log('─'.repeat(66));

  // Validar resultado
  console.log('\n✅ Validação:');
  if (resultado.cabecalho) {
    console.log('   ✓ Cabecalho foi parseado');
    console.log(`   ✓ Sucesso: ${resultado.cabecalho.sucesso}`);
    console.log(`   ✓ Versão: ${resultado.cabecalho.versao}`);
  } else {
    console.log('   ✗ Cabecalho é null');
  }

  if (resultado.chavesNFeRPS.length > 0) {
    console.log(`   ✓ ${resultado.chavesNFeRPS.length} chave(s) encontrada(s)`);
    resultado.chavesNFeRPS.forEach((chave, idx) => {
      console.log(`      Chave ${idx + 1}:`);
      console.log(`        NF-e: ${chave.numeroNFe}`);
      console.log(`        CV: ${chave.codigoVerificacao}`);
      console.log(`        RPS: ${chave.chaveRPS?.numeroRPS}`);
    });
  } else {
    console.log('   ✗ Não há chaves parseadas');
  }

  console.log('\n');
}

// Executar
if (require.main === module) {
  runTest().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });
}

module.exports = { parseResultadoOperacaoXml };
