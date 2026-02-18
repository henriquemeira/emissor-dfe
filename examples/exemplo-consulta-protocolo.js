#!/usr/bin/env node
/**
 * Exemplo de Uso: ConsultaSituacaoLote com Parsing de ResultadoOperacao
 * 
 * Este exemplo demonstra como usar a função consultaSituacaoLote
 * e acessar os dados parseados do ResultadoOperacao
 */

const nfseSpService = require('../src/services/nfse/sp/sao-paulo/nfse-sp.service');

/**
 * Exemplo 1: Realizar consulta e acessar dados estruturados
 */
async function exemplo1_ConsultarProtocolo() {
  console.log('Exemplo 1: Consultar Protocolo e Acessar Dados Estruturados');
  console.log('='.repeat(70));
  
  try {
    // Dados da requisição
    const data = {
      layoutVersion: 'v01-1',
      cpfCnpjRemetente: {
        cnpj: '52507723000185',
        cpf: null,
      },
      numeroProtocolo: '123456789',
      includeSoap: false, // Opcional: incluir SOAP envelope na resposta
    };
    
    // API key para autenticação
    const apiKey = 'sua-api-key-aqui';
    const isTest = true; // Usar ambiente de teste
    
    // Chamar serviço
    const response = await nfseSpService.consultaSituacaoLote(
      data,
      apiKey,
      isTest
    );
    
    // Estrutura de resposta:
    // response = {
    //   success: true,
    //   layoutVersion: 'v01-1',
    //   resultado: {
    //     sucesso: true,
    //     situacao: { valor: '3', nome: 'processado' },
    //     numeroLote: '1677901786',
    //     dataRecebimento: '2026-02-18T19:29:43',
    //     dataProcessamento: '2026-02-18T19:29:43',
    //     resultadoOperacao: { ... }, // Campo original mantido
    //     resultado: { ... }, // NOVO CAMPO COM DADOS PARSEADOS
    //     erros: []
    //   }
    // }
    
    console.log('\n✓ Resposta recebida com sucesso\n');
    console.log('Status da consulta:', response.resultado.sucesso);
    console.log('Situação do lote:', response.resultado.situacao);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

/**
 * Exemplo 2: Acessar dados estruturados do ResultadoOperacao
 */
async function exemplo2_AcessarDadosParsados() {
  console.log('\n\nExemplo 2: Acessar Dados Estruturados do ResultadoOperacao');
  console.log('='.repeat(70));
  
  try {
    const data = {
      layoutVersion: 'v01-1',
      cpfCnpjRemetente: { cnpj: '52507723000185', cpf: null },
      numeroProtocolo: '123456789',
    };
    
    const response = await nfseSpService.consultaSituacaoLote(
      data,
      'sua-api-key-aqui',
      true
    );
    
    // NOVO: Acessar dados parseados
    const resultado = response.resultado.resultado;
    
    if (resultado) {
      console.log('\n╔════════════════════════════════════════════════════════════════════╗');
      console.log('║ CABEÇALHO DO LOTE PROCESSADO                                       ║');
      console.log('╚════════════════════════════════════════════════════════════════════╝\n');
      
      const cab = resultado.cabecalho;
      console.log('  Sucesso:', cab.sucesso);
      console.log('  Versão:', cab.versao);
      console.log('\n  Informações do Lote:');
      console.log('    Número do Lote:', cab.informacoesLote.numeroLote);
      console.log('    Inscrição do Prestador:', cab.informacoesLote.inscricaoPrestador);
      console.log('    CNPJ Remetente:', cab.informacoesLote.cpfCnpjRemetente.cnpj);
      console.log('    Data de Envio:', cab.informacoesLote.dataEnvioLote);
      console.log('    Qtd Notas Processadas:', cab.informacoesLote.qtdNotasProcessadas);
      console.log('    Valor Total Serviços:', 'R$', cab.informacoesLote.valorTotalServicos);
      
      console.log('\n╔════════════════════════════════════════════════════════════════════╗');
      console.log('║ CHAVES DE NF-e E RPS PROCESSADAS                                   ║');
      console.log('╚════════════════════════════════════════════════════════════════════╝\n');
      
      resultado.chavesNFeRPS.forEach((chave, index) => {
        console.log(`  NF-e ${index + 1}:`);
        console.log('    Número NF-e:', chave.numeroNFe);
        console.log('    Código de Verificação:', chave.codigoVerificacao);
        console.log('    RPS Origem:');
        console.log('      Série:', chave.chaveRPS.serieRPS);
        console.log('      Número:', chave.chaveRPS.numeroRPS);
        console.log();
      });
      
      if (resultado.alertas.length > 0) {
        console.log('╔════════════════════════════════════════════════════════════════════╗');
        console.log('║ ALERTAS                                                            ║');
        console.log('╚════════════════════════════════════════════════════════════════════╝\n');
        
        resultado.alertas.forEach(alerta => {
          console.log(`  [${alerta.codigo}] ${alerta.descricao}`);
        });
        console.log();
      }
      
      if (resultado.erros.length > 0) {
        console.log('╔════════════════════════════════════════════════════════════════════╗');
        console.log('║ ERROS                                                              ║');
        console.log('╚════════════════════════════════════════════════════════════════════╝\n');
        
        resultado.erros.forEach(erro => {
          console.log(`  [${erro.codigo}] ${erro.descricao}`);
        });
        console.log();
      }
    }
    
  } catch (error) {
    console.error('Erro durante consulta:', error.message);
  }
}

/**
 * Exemplo 3: Comparação antes vs. depois
 */
function exemplo3_ComparacaoAnteVs() {
  console.log('\n\nExemplo 3: Comparação Antes vs. Depois');
  console.log('='.repeat(70));
  
  console.log('\n📍 ANTES (sem parsing automático):\n');
  console.log(`const xmlString = response.resultado.resultadoOperacao._;
// XML bruto continuava assim:
// '<RetornoEnvioLoteRPS xmlns=...>
//   <Cabecalho Versao="1">
//     <Sucesso>true</Sucesso>
//     <InformacoesLote>...'
// 
// Usuário precisava fazer parsing manual:
const parser = new xml2js.Parser();
const parsedXml = await parser.parseStringPromise(xmlString);
// ... acessar dados baseado na estrutura complexa do xml2js
`);
  
  console.log('\n\n📍 DEPOIS (com parsing automático):\n');
  console.log(`const resultado = response.resultado.resultado;
// Acesso direto aos dados estruturados:
console.log(resultado.cabecalho.informacoesLote.numeroLote);
console.log(resultado.chavesNFeRPS[0].numeroNFe);
console.log(resultado.alertas);
console.log(resultado.erros);
// Muito mais simples e legível!
`);
}

/**
 * Exemplo 4: Tratamento de cenários comuns
 */
async function exemplo4_CenariosComuns() {
  console.log('\n\nExemplo 4: Tratamento de Cenários Comuns');
  console.log('='.repeat(70));
  
  try {
    const response = {
      resultado: {
        resultado: {
          cabecalho: { sucesso: true, versao: 1, informacoesLote: {} },
          alertas: [{ codigo: 'AVS001', descricao: 'Alerta de teste' }],
          erros: [],
          chavesNFeRPS: [{ numeroNFe: '1', codigoVerificacao: 'ABC123' }],
        },
      },
    };
    
    // Cenário 1: Verificar se houve sucesso
    console.log('\n1️⃣  Verificar Sucesso:');
    if (response.resultado.resultado?.cabecalho?.sucesso) {
      console.log('   ✓ Processamento bem-sucedido');
    }
    
    // Cenário 2: Verificar alertas
    console.log('\n2️⃣  Verificar Alertas:');
    if (response.resultado.resultado?.alertas?.length > 0) {
      console.log(`   ⚠️  ${response.resultado.resultado.alertas.length} alerta(s) encontrado(s)`);
      response.resultado.resultado.alertas.forEach(a => {
        console.log(`      [${a.codigo}] ${a.descricao}`);
      });
    } else {
      console.log('   ✓ Sem alertas');
    }
    
    // Cenário 3: Verificar erros
    console.log('\n3️⃣  Verificar Erros:');
    if (response.resultado.resultado?.erros?.length > 0) {
      console.log(`   ❌ ${response.resultado.resultado.erros.length} erro(s) encontrado(s)`);
    } else {
      console.log('   ✓ Sem erros');
    }
    
    // Cenário 4: Processar chaves de NF-e
    console.log('\n4️⃣  Processar Chaves de NF-e:');
    const chaves = response.resultado.resultado?.chavesNFeRPS || [];
    console.log(`   ${chaves.length} NF-e(s) processada(s):`);
    chaves.forEach((chave, i) => {
      console.log(`      ${i + 1}. NF-e nº ${chave.numeroNFe} - CV: ${chave.codigoVerificacao}`);
    });
    
    // Cenário 5: Acessar dados com segurança (optional chaining)
    console.log('\n5️⃣  Acesso Seguro com Optional Chaining:');
    const numeroLote = response.resultado.resultado?.cabecalho?.informacoesLote?.numeroLote;
    const qtdNotas = response.resultado.resultado?.cabecalho?.informacoesLote?.qtdNotasProcessadas;
    console.log(`   Lote nº: ${numeroLote || 'N/A'}`);
    console.log(`   Notas processadas: ${qtdNotas || 0}`);
    
  } catch (error) {
    console.error('Erro no exemplo:', error.message);
  }
}

/**
 * Executar todos os exemplos
 */
async function executarTodosExemplos() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║         EXEMPLOS DE USO - CONSULTA DE PROTOCOLO                    ║');
  console.log('║     Com Parsing Automático de RetornoEnvioLoteRPS                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  // Apenas exemplos estruturais (não executar sem credenciais reais)
  exemplo3_ComparacaoAnteVs();
  await exemplo4_CenariosComuns();
  
  console.log('\n\n📝 NOTAS IMPORTANTES:\n');
  console.log('• Os exemplos 1 e 2 requerem credenciais reais para executar');
  console.log('• O campo "resultado" contém dados parseados automaticamente');
  console.log('• O campo "resultadoOperacao" original é mantido para compatibilidade');
  console.log('• Use optional chaining (?.) para acesso seguro aos dados');
  console.log('• Arrays vazios são retornados se não houver alertas/erros/chaves');
  
  console.log('\n\n✅ Implementação concluída com sucesso!');
  console.log('   A resposta agora é muito mais fácil de usar e parsear.\n');
}

// Executar
if (require.main === module) {
  executarTodosExemplos();
}

module.exports = {
  exemplo1_ConsultarProtocolo,
  exemplo2_AcessarDadosParsados,
  exemplo3_ComparacaoAnteVs,
  exemplo4_CenariosComuns,
};
