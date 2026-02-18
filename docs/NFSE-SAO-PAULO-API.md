# API NFS-e São Paulo - Documentação

## Visão Geral

Esta API implementa a Fase 2 da emissão de NFS-e (Nota Fiscal de Serviço Eletrônica) para o município de São Paulo/SP, conforme especificações do layout **v01-1** (assíncrono).

### Características

- ✅ Suporte ao método **EnvioLoteRpsAsync** (envio assíncrono de lote de RPS)
- ✅ Suporte ao método **TesteEnvioLoteRpsAsync** (validação sem emissão)
- ✅ Suporte ao método **ConsultaSituacaoLote** (consulta de situação do lote)
- ✅ Assinatura digital automática dos RPS e do lote
- ✅ Validação completa dos dados conforme XSD
- ✅ Comunicação via SOAP com a Prefeitura de São Paulo
- ✅ Autenticação via API Key
- ✅ Suporte a ambientes de teste e produção

### Versão do Layout

- **Layout suportado:** `v01-1`
- **Schema:** PedidoEnvioLoteRPS_v01.xsd
- **WSDL:** nfews.prefeitura.sp.gov.br_lotenfeasync.asmx_WSDL.xml

⚠️ **Importante:** Este layout **não inclui** as tags IBS/CBS da reforma tributária.

---

## Endpoints

### 1. Envio de Lote de RPS

Envia um lote de RPS para emissão de NFS-e.

**Endpoint:** `POST /api/v1/nfse/sp/sao-paulo/envio-lote-rps`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "layoutVersion": "v01-1",
  "ambiente": "teste",
  "lote": {
    "cabecalho": {
      "cpfCnpjRemetente": {
        "cnpj": "12345678901234"
      },
      "transacao": true,
      "dtInicio": "2024-01-01",
      "dtFim": "2024-01-31",
      "qtdRPS": 1,
      "valorTotalServicos": 1000.00,
      "valorTotalDeducoes": 0.00
    },
    "rps": [
      {
        "chaveRPS": {
          "inscricaoPrestador": 12345678,
          "serieRPS": "NF",
          "numeroRPS": 1
        },
        "tipoRPS": "RPS",
        "dataEmissao": "2024-01-15",
        "statusRPS": "N",
        "tributacaoRPS": "T",
        "valorServicos": 1000.00,
        "valorDeducoes": 0.00,
        "codigoServico": 1234,
        "aliquotaServicos": 0.05,
        "issRetido": false,
        "cpfCnpjTomador": {
          "cnpj": "98765432109876"
        },
        "razaoSocialTomador": "Empresa Tomadora Ltda",
        "enderecoTomador": {
          "tipoLogradouro": "Rua",
          "logradouro": "Das Flores",
          "numeroEndereco": "123",
          "bairro": "Centro",
          "cidade": 3550308,
          "uf": "SP",
          "cep": 12345678
        },
        "emailTomador": "tomador@exemplo.com.br",
        "discriminacao": "Serviços de consultoria em TI prestados no período de 01/01/2024 a 31/01/2024"
      }
    ]
  }
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "layoutVersion": "v01-1",
    "resultado": {
      "sucesso": true,
      "versao": "1",
      "informacoesLote": {
        "numeroProtocolo": "123456789",
        "dataRecebimento": "2024-01-15T10:30:00"
      }
    }
  }
}
```

**Resposta de Erro (400):**
```json
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_LAYOUT",
    "message": "Layout não suportado. Versão esperada: v01-1"
  }
}
```

---

### 2. Teste de Envio de Lote de RPS

Testa o envio de um lote de RPS sem gerar NFS-e (apenas validação).

**Endpoint:** `POST /api/v1/nfse/sp/sao-paulo/teste-envio-lote-rps`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:** (mesmo formato do endpoint de envio)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "layoutVersion": "v01-1",
    "resultado": {
      "sucesso": true,
      "versao": "1",
      "informacoesLote": {
        "numeroProtocolo": "TEST123456789",
        "dataRecebimento": "2024-01-15T10:30:00"
      }
    }
  }
}
```

---

### 3. Consulta de Situação do Lote

Consulta o status de processamento de um lote usando o número do protocolo.

**Endpoint:** `POST /api/v1/nfse/sp/sao-paulo/consulta-situacao-lote`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "layoutVersion": "v01-1",
  "ambiente": "teste",
  "cpfCnpjRemetente": {
    "cnpj": "12345678901234"
  },
  "numeroProtocolo": "ce511ff737bb48a897309ad41e0642f3"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "layoutVersion": "v01-1",
    "resultado": {
      "sucesso": true,
      "situacao": {
        "codigo": 3,
        "nome": "processado"
      },
      "numeroLote": 12345,
      "dataRecebimento": "2024-01-15T10:30:00",
      "dataProcessamento": "2024-01-15T10:35:00",
      "resultadoOperacao": "Lote processado com sucesso"
    }
  }
}
```

**Códigos de Situação do Lote:**
| Código | Nome | Descrição |
|--------|------|-----------|
| 0 | enviado | Lote enviado e aguardando processamento |
| 1 | invalidado | Lote invalidado devido a erros |
| 2 | verificado | Lote verificado e em processamento |
| 3 | processado | Lote processado com sucesso |

**Resposta de Erro (400):**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_PROTOCOL",
    "message": "Campo numeroProtocolo é obrigatório"
  }
}
```

---

## Estrutura de Dados

### Cabeçalho do Lote

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cpfCnpjRemetente` | Object | Sim | CPF/CNPJ do remetente autorizado |
| `cpfCnpjRemetente.cnpj` | String(14) | Sim* | CNPJ (somente números) |
| `cpfCnpjRemetente.cpf` | String(11) | Sim* | CPF (somente números) |
| `transacao` | Boolean | Não | Se true, todo o lote é processado em transação. Padrão: true |
| `dtInicio` | Date | Sim | Data início do período (YYYY-MM-DD) |
| `dtFim` | Date | Sim | Data fim do período (YYYY-MM-DD) |
| `qtdRPS` | Integer | Sim | Quantidade de RPS no lote |
| `valorTotalServicos` | Decimal | Sim | Valor total dos serviços do lote |
| `valorTotalDeducoes` | Decimal | Não | Valor total das deduções do lote |

\* Informar CPF **ou** CNPJ

### RPS (Recibo Provisório de Serviços)

#### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `chaveRPS.inscricaoPrestador` | Integer(8) | CCM (Cadastro de Contribuintes Mobiliários) |
| `chaveRPS.serieRPS` | String(5) | Série do RPS |
| `chaveRPS.numeroRPS` | Integer(12) | Número do RPS |
| `tipoRPS` | String | Tipo do RPS (ex: "RPS") |
| `dataEmissao` | Date | Data de emissão (YYYY-MM-DD) |
| `statusRPS` | String(1) | N=Normal, C=Cancelado, E=Extraviado |
| `tributacaoRPS` | String(1) | T=Tributação em SP, F=Fora de SP, I=Isento, J=ISS Suspenso |
| `valorServicos` | Decimal | Valor dos serviços |
| `valorDeducoes` | Decimal | Valor das deduções (pode ser 0.00) |
| `codigoServico` | Integer | Código do serviço (consultar tabela da prefeitura) |
| `aliquotaServicos` | Decimal(4) | Alíquota (ex: 0.05 para 5%) |
| `issRetido` | Boolean | Se ISS foi retido |
| `discriminacao` | String(2000) | Descrição dos serviços |

#### Campos Opcionais - Tributos Federais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `valorPIS` | Decimal | Retenção PIS |
| `valorCOFINS` | Decimal | Retenção COFINS |
| `valorINSS` | Decimal | Retenção INSS |
| `valorIR` | Decimal | Retenção IR |
| `valorCSLL` | Decimal | Retenção CSLL |

#### Campos Opcionais - Tomador

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cpfCnpjTomador` | Object | CPF/CNPJ do tomador |
| `inscricaoMunicipalTomador` | Integer(8) | CCM do tomador (se em SP) |
| `inscricaoEstadualTomador` | Integer | IE do tomador |
| `razaoSocialTomador` | String(75) | Nome/Razão Social |
| `enderecoTomador` | Object | Endereço do tomador |
| `emailTomador` | String(75) | E-mail do tomador |

#### Campos Opcionais - Intermediário

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cpfCnpjIntermediario` | Object | CPF/CNPJ do intermediário |
| `inscricaoMunicipalIntermediario` | Integer(8) | CCM do intermediário |
| `issRetidoIntermediario` | String | Retenção ISS pelo intermediário |
| `emailIntermediario` | String(75) | E-mail do intermediário |

#### Campos Opcionais - Carga Tributária

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `valorCargaTributaria` | Decimal | Valor da carga tributária em R$ |
| `percentualCargaTributaria` | Decimal | Percentual da carga tributária |
| `fonteCargaTributaria` | String | Fonte da informação |

#### Campos Opcionais - Construção Civil

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `codigoCEI` | Integer | Código CEI (Cadastro Específico do INSS) |
| `matriculaObra` | Integer | Matrícula da obra |
| `municipioPrestacao` | Integer(7) | Código IBGE do município |
| `numeroEncapsulamento` | Integer | Número do encapsulamento |
| `valorTotalRecebido` | Decimal | Valor total recebido |

### Estrutura de Endereço

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tipoLogradouro` | String(3) | Ex: "Rua", "Av", "Pça" |
| `logradouro` | String(50) | Nome da rua/avenida |
| `numeroEndereco` | String(10) | Número |
| `complementoEndereco` | String(30) | Complemento |
| `bairro` | String(30) | Bairro |
| `cidade` | Integer(7) | Código IBGE da cidade |
| `uf` | String(2) | UF (ex: "SP") |
| `cep` | Integer(8) | CEP (somente números) |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `MISSING_LAYOUT_VERSION` | Campo layoutVersion não foi informado |
| `UNSUPPORTED_LAYOUT` | Layout informado não é suportado (deve ser v01-1) |
| `MISSING_LOTE` | Campo lote não foi informado |
| `MISSING_CPF_CNPJ` | Campo cpfCnpjRemetente não foi informado |
| `MISSING_PROTOCOL` | Campo numeroProtocolo não foi informado |
| `INVALID_API_KEY` | API Key inválida ou não encontrada |
| Outros | Erros específicos retornados pela Prefeitura de SP |

---

## Fluxo de Processamento

1. **Recepção do JSON** - API recebe os dados em formato JSON
2. **Validação do Layout** - Verifica se layoutVersion é "v01-1"
3. **Validação de Dados** - Valida campos obrigatórios e formatos
4. **Recuperação do Certificado** - Busca certificado digital pela API Key
5. **Assinatura dos RPS** - Assina cada RPS individualmente
6. **Construção do XML** - Gera XML conforme schema PedidoEnvioLoteRPS_v01.xsd
7. **Assinatura do Lote** - Assina o XML completo (XML-DSig)
8. **Envio SOAP** - Transmite para o web service da prefeitura
9. **Processamento da Resposta** - Processa RetornoEnvioLoteRPSAsync
10. **Retorno JSON** - Retorna resultado ao cliente

---

## Ambientes

### Teste (Homologação)
- Endpoint: `https://nfews-homologacao.prefeitura.sp.gov.br/lotenfeasync.asmx`
- Ativar com: `"ambiente": "teste"`
- ⚠️ **IMPORTANTE:** A URL do ambiente de teste não está documentada oficialmente nos materiais disponíveis. Foi inferida com base em padrões comuns dos web services da Prefeitura de São Paulo. Deve ser verificada junto à municipalidade antes do uso em produção.

### Produção
- Endpoint: `https://nfews.prefeitura.sp.gov.br/lotenfeasync.asmx`
- Ativar com: `"ambiente": "producao"` + configurar conta como produção

---

## Assinatura Digital

A assinatura dos RPS segue especificação da Prefeitura de São Paulo:

### String de Assinatura (86 caracteres)
1. Inscrição Municipal (8 posições, zeros à esquerda)
2. Série do RPS (5 posições, espaços à direita)
3. Número do RPS (12 posições, zeros à esquerda)
4. Data de emissão (8 posições, formato YYYYMMDD)
5. Tipo de Tributação (1 posição: T, F, I ou J)
6. Status do RPS (1 posição: N, C ou E)
7. ISS Retido (1 posição: S ou N)
8. Valor dos Serviços (15 posições, sem separadores)
9. Valor das Deduções (15 posições, sem separadores)
10. Código do Serviço (5 posições, zeros à esquerda)
11. Indicador de CPF/CNPJ do Tomador (1 posição: 1=CPF, 2=CNPJ, 3=Não informado)
12. CPF/CNPJ do Tomador (14 posições, zeros à esquerda)
13. Indicador de CPF/CNPJ do intermediário (1 posição: 1=CPF, 2=CNPJ, 3=Não informado)
14. CPF/CNPJ do do intermediário (14 posições, zeros à esquerda)
15. ISS Retido Intermediário (1 posição: S ou N)

**Total: 86 caracteres**

A string é assinada usando SHA-1 com RSA e codificada em Base64.

---

## Exemplo Completo

```bash
curl -X POST http://localhost:3000/api/v1/nfse/sp/sao-paulo/envio-lote-rps \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "layoutVersion": "v01-1",
    "ambiente": "teste",
    "lote": {
      "cabecalho": {
        "cpfCnpjRemetente": {
          "cnpj": "12345678901234"
        },
        "transacao": true,
        "dtInicio": "2024-01-01",
        "dtFim": "2024-01-31",
        "qtdRPS": 1,
        "valorTotalServicos": 1000.00,
        "valorTotalDeducoes": 0.00
      },
      "rps": [
        {
          "chaveRPS": {
            "inscricaoPrestador": 12345678,
            "serieRPS": "NF",
            "numeroRPS": 1
          },
          "tipoRPS": "RPS",
          "dataEmissao": "2024-01-15",
          "statusRPS": "N",
          "tributacaoRPS": "T",
          "valorServicos": 1000.00,
          "valorDeducoes": 0.00,
          "codigoServico": 1234,
          "aliquotaServicos": 0.05,
          "issRetido": false,
          "discriminacao": "Serviços de consultoria em TI"
        }
      ]
    }
  }'
```

---

## Notas Importantes

1. ⚠️ **Certificado Digital:** É obrigatório ter um certificado digital válido cadastrado na conta
2. ⚠️ **Layout v01-1:** Este é o único layout suportado atualmente
3. ⚠️ **Sem IBS/CBS:** Este layout não contempla as tags da reforma tributária
4. ⚠️ **Processamento Assíncrono:** O retorno do envio indica apenas o recebimento do lote, não a emissão final
5. ℹ️ **Consulta de Status:** Use o método ConsultaSituacaoLote para verificar o processamento do lote

---

## Próximos Passos

As seguintes funcionalidades serão implementadas em fases futuras:

- [x] ConsultaSituacaoLote - Consultar situação do lote
- [ ] ConsultaSituacaoGuiaAsync - Consultar situação da guia
- [ ] ConsultaGuiaAsync - Consultar dados da guia
- [ ] EmissaoGuiaAsync - Emissão de guia de recolhimento

---

## Suporte

Para dúvidas sobre o layout, consulte a documentação oficial da Prefeitura de São Paulo:
- NFe_Web_Service.pdf
- Schemas XSD em `docs/nfse/SP/Sao_Paulo/schemas-assincrono-v01-1/`
