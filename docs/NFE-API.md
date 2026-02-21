# API NF-e - Documentação

## Visão Geral

Esta API implementa a emissão completa de NF-e (Nota Fiscal Eletrônica) versão 4.00, conforme especificações do Projeto NF-e e Manual de Orientação ao Contribuinte (MOC) v7.0.

### Características

- ✅ **Emissão de NF-e** - Conversão de JSON para XML, assinatura digital e envio ao SEFAZ (NFeAutorizacao4)
- ✅ **Consulta de NF-e** - Consulta por chave de acesso (NfeConsultaProtocolo4)
- ✅ **Cancelamento de NF-e** - Evento de cancelamento (NFeRecepcaoEvento4, tpEvento=110111)
- ✅ **Inutilização de numeração** - Inutiliza faixa de números (NfeInutilizacao4)
- ✅ **Assinatura digital automática** - XML-DSig com certificado A1
- ✅ **Suporte a todos os estados** - Endpoints SEFAZ por UF (NF-e v4.00)
- ✅ **Autenticação via API Key**
- ✅ **Suporte a ambientes de homologação e produção**

### Versão

- **NF-e versão:** 4.00
- **Schema:** leiauteNFe_v4.00.xsd / nfe_v4.00.xsd
- **MOC:** v7.0

---

## Endpoints

### 1. Emitir NF-e

Converte os dados JSON em XML, assina digitalmente e transmite ao SEFAZ para autorização.

**Endpoint:** `POST /api/v1/nfe/emitir`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "versao": "4.00",
  "ambiente": "homologacao",
  "idLote": 1,
  "indSinc": 1,
  "nfe": {
    "ide": {
      "cUF": 35,
      "natOp": "Venda de mercadoria",
      "mod": 55,
      "serie": 1,
      "nNF": 1,
      "dhEmi": "2024-01-15T10:00:00-03:00",
      "tpNF": 1,
      "idDest": 1,
      "cMunFG": 3550308,
      "tpImp": 1,
      "tpEmis": 1,
      "tpAmb": 2,
      "finNFe": 1,
      "indFinal": 1,
      "indPres": 1,
      "procEmi": 0,
      "verProc": "1.0.0"
    },
    "emit": {
      "CNPJ": "12345678901234",
      "xNome": "Empresa Emitente Ltda",
      "xFant": "Emitente",
      "enderEmit": {
        "xLgr": "Rua das Flores",
        "nro": "100",
        "xBairro": "Centro",
        "cMun": 3550308,
        "xMun": "São Paulo",
        "UF": "SP",
        "CEP": "01310100",
        "cPais": 1058,
        "xPais": "Brasil",
        "fone": "1133334444"
      },
      "IE": "111111111111",
      "CRT": 3
    },
    "dest": {
      "CNPJ": "98765432109876",
      "xNome": "Empresa Destinatária Ltda",
      "enderDest": {
        "xLgr": "Av. Paulista",
        "nro": "200",
        "xBairro": "Bela Vista",
        "cMun": 3550308,
        "xMun": "São Paulo",
        "UF": "SP",
        "CEP": "01310100",
        "cPais": 1058,
        "xPais": "Brasil"
      },
      "indIEDest": 1,
      "IE": "222222222222"
    },
    "det": [
      {
        "nItem": 1,
        "prod": {
          "cProd": "001",
          "cEAN": "SEM GTIN",
          "xProd": "Produto de Exemplo",
          "NCM": "84715000",
          "CFOP": "5102",
          "uCom": "UN",
          "qCom": 1.0,
          "vUnCom": 100.00,
          "vProd": 100.00,
          "cEANTrib": "SEM GTIN",
          "uTrib": "UN",
          "qTrib": 1.0,
          "vUnTrib": 100.00,
          "indTot": 1
        },
        "imposto": {
          "vTotTrib": 14.50,
          "ICMS": {
            "ICMS00": {
              "orig": 0,
              "CST": "00",
              "modBC": 3,
              "vBC": 100.00,
              "pICMS": 12.00,
              "vICMS": 12.00
            }
          },
          "PIS": {
            "PISAliq": {
              "CST": "01",
              "vBC": 100.00,
              "pPIS": 0.65,
              "vPIS": 0.65
            }
          },
          "COFINS": {
            "COFINSAliq": {
              "CST": "01",
              "vBC": 100.00,
              "pCOFINS": 3.00,
              "vCOFINS": 3.00
            }
          }
        }
      }
    ],
    "total": {
      "ICMSTot": {
        "vBC": 100.00,
        "vICMS": 12.00,
        "vICMSDeson": 0.00,
        "vFCP": 0.00,
        "vBCST": 0.00,
        "vST": 0.00,
        "vFCPST": 0.00,
        "vFCPSTRet": 0.00,
        "vProd": 100.00,
        "vFrete": 0.00,
        "vSeg": 0.00,
        "vDesc": 0.00,
        "vII": 0.00,
        "vIPI": 0.00,
        "vIPIDevol": 0.00,
        "vPIS": 0.65,
        "vCOFINS": 3.00,
        "vOutro": 0.00,
        "vNF": 100.00
      }
    },
    "transp": {
      "modFrete": 9
    },
    "pag": {
      "detPag": [
        {
          "tPag": "01",
          "vPag": 100.00
        }
      ]
    }
  }
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ambiente` | String | Sim | `"homologacao"` ou `"producao"` |
| `nfe` | Object | Sim | Dados completos da NF-e (ver estrutura abaixo) |
| `idLote` | Integer | Não | Identificador do lote (padrão: 1) |
| `indSinc` | Integer | Não | 0=assíncrono, 1=síncrono (padrão: 1) |
| `includeSoap` | Boolean | Não | Incluir SOAP bruto na resposta (padrão: false) |
| `endpointOverride` | String | Não | URL personalizada do webservice SEFAZ |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "chaveAcesso": "35240112345678901234550010000000011000000019",
    "resultado": {
      "retEnviNFe": {
        "$": { "versao": "4.00", "xmlns": "http://www.portalfiscal.inf.br/nfe" },
        "tpAmb": "2",
        "verAplic": "SVRS202401010000",
        "cStat": "104",
        "xMotivo": "Lote processado",
        "cUF": "35",
        "dhRecbto": "2024-01-15T10:00:30-03:00",
        "protNFe": {
          "infProt": {
            "tpAmb": "2",
            "verAplic": "SVRS202401010000",
            "chNFe": "35240112345678901234550010000000011000000019",
            "dhRecbto": "2024-01-15T10:00:30-03:00",
            "nProt": "135240000000001",
            "digVal": "abc123...",
            "cStat": "100",
            "xMotivo": "Autorizado o uso da NF-e"
          }
        }
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
    "code": "MISSING_NFE",
    "message": "Campo nfe é obrigatório"
  }
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/nfe/emitir \
  -H "X-API-Key: sua-api-key-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "versao": "4.00",
    "ambiente": "homologacao",
    "idLote": 1,
    "indSinc": 1,
    "nfe": {
      "ide": {
        "cUF": 35,
        "natOp": "Venda de mercadoria",
        "mod": 55,
        "serie": 1,
        "nNF": 1,
        "dhEmi": "2024-01-15T10:00:00-03:00",
        "tpNF": 1,
        "idDest": 1,
        "cMunFG": 3550308,
        "tpImp": 1,
        "tpEmis": 1,
        "tpAmb": 2,
        "finNFe": 1,
        "indFinal": 1,
        "indPres": 1,
        "procEmi": 0,
        "verProc": "1.0.0"
      },
      "emit": {
        "CNPJ": "12345678901234",
        "xNome": "Empresa Emitente Ltda",
        "enderEmit": {
          "xLgr": "Rua das Flores",
          "nro": "100",
          "xBairro": "Centro",
          "cMun": 3550308,
          "xMun": "São Paulo",
          "UF": "SP",
          "CEP": "01310100",
          "cPais": 1058,
          "xPais": "Brasil"
        },
        "IE": "111111111111",
        "CRT": 3
      },
      "dest": {
        "CNPJ": "98765432109876",
        "xNome": "Empresa Destinatária Ltda",
        "enderDest": {
          "xLgr": "Av. Paulista",
          "nro": "200",
          "xBairro": "Bela Vista",
          "cMun": 3550308,
          "xMun": "São Paulo",
          "UF": "SP",
          "CEP": "01310100",
          "cPais": 1058,
          "xPais": "Brasil"
        },
        "indIEDest": 1,
        "IE": "222222222222"
      },
      "det": [
        {
          "nItem": 1,
          "prod": {
            "cProd": "001",
            "cEAN": "SEM GTIN",
            "xProd": "Produto de Exemplo",
            "NCM": "84715000",
            "CFOP": "5102",
            "uCom": "UN",
            "qCom": 1.0,
            "vUnCom": 100.00,
            "vProd": 100.00,
            "cEANTrib": "SEM GTIN",
            "uTrib": "UN",
            "qTrib": 1.0,
            "vUnTrib": 100.00,
            "indTot": 1
          },
          "imposto": {
            "vTotTrib": 14.50,
            "ICMS": {
              "ICMS00": {
                "orig": 0,
                "CST": "00",
                "modBC": 3,
                "vBC": 100.00,
                "pICMS": 12.00,
                "vICMS": 12.00
              }
            },
            "PIS": {
              "PISAliq": {
                "CST": "01",
                "vBC": 100.00,
                "pPIS": 0.65,
                "vPIS": 0.65
              }
            },
            "COFINS": {
              "COFINSAliq": {
                "CST": "01",
                "vBC": 100.00,
                "pCOFINS": 3.00,
                "vCOFINS": 3.00
              }
            }
          }
        }
      ],
      "total": {
        "ICMSTot": {
          "vBC": 100.00,
          "vICMS": 12.00,
          "vICMSDeson": 0.00,
          "vFCP": 0.00,
          "vBCST": 0.00,
          "vST": 0.00,
          "vFCPST": 0.00,
          "vFCPSTRet": 0.00,
          "vProd": 100.00,
          "vFrete": 0.00,
          "vSeg": 0.00,
          "vDesc": 0.00,
          "vII": 0.00,
          "vIPI": 0.00,
          "vIPIDevol": 0.00,
          "vPIS": 0.65,
          "vCOFINS": 3.00,
          "vOutro": 0.00,
          "vNF": 100.00
        }
      },
      "transp": {
        "modFrete": 9
      },
      "pag": {
        "detPag": [
          {
            "tPag": "01",
            "vPag": 100.00
          }
        ]
      }
    }
  }'
```

---

### 2. Consultar NF-e

Consulta o status de uma NF-e pela chave de acesso (44 dígitos) via serviço NfeConsultaProtocolo4.

**Endpoint:** `POST /api/v1/nfe/consultar`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "ambiente": "homologacao",
  "chNFe": "35240112345678901234550010000000011000000019"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ambiente` | String | Sim | `"homologacao"` ou `"producao"` |
| `chNFe` | String(44) | Sim | Chave de acesso com 44 dígitos |
| `cUF` | Integer | Não | Código da UF (extraído da chNFe se omitido) |
| `includeSoap` | Boolean | Não | Incluir SOAP bruto na resposta (padrão: false) |
| `endpointOverride` | String | Não | URL personalizada do webservice SEFAZ |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "resultado": {
      "retConsSitNFe": {
        "$": { "versao": "4.00", "xmlns": "http://www.portalfiscal.inf.br/nfe" },
        "tpAmb": "2",
        "verAplic": "SVRS202401010000",
        "cStat": "100",
        "xMotivo": "Autorizado o uso da NF-e",
        "cUF": "35",
        "dhRecbto": "2024-01-15T10:00:30-03:00",
        "chNFe": "35240112345678901234550010000000011000000019",
        "protNFe": {
          "infProt": {
            "tpAmb": "2",
            "verAplic": "SVRS202401010000",
            "chNFe": "35240112345678901234550010000000011000000019",
            "dhRecbto": "2024-01-15T10:00:30-03:00",
            "nProt": "135240000000001",
            "digVal": "abc123...",
            "cStat": "100",
            "xMotivo": "Autorizado o uso da NF-e"
          }
        }
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
    "code": "MISSING_CHNFE",
    "message": "Campo chNFe (chave de acesso) é obrigatório"
  }
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/nfe/consultar \
  -H "X-API-Key: sua-api-key-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "ambiente": "homologacao",
    "chNFe": "35240112345678901234550010000000011000000019"
  }'
```

---

### 3. Cancelar NF-e

Cancela uma NF-e autorizada enviando um evento de cancelamento (tpEvento=110111) via NFeRecepcaoEvento4.

> ⚠️ **Atenção:** O cancelamento só é possível dentro do prazo estabelecido pela SEFAZ (geralmente até 24 horas após a autorização, ou antes de qualquer movimentação de mercadoria).

**Endpoint:** `POST /api/v1/nfe/cancelar`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "ambiente": "homologacao",
  "chNFe": "35240112345678901234550010000000011000000019",
  "nProt": "135240000000001",
  "xJust": "Cancelamento solicitado por erro no pedido",
  "CNPJ": "12345678901234"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ambiente` | String | Sim | `"homologacao"` ou `"producao"` |
| `chNFe` | String(44) | Sim | Chave de acesso com 44 dígitos |
| `nProt` | String | Sim | Número do protocolo de autorização |
| `xJust` | String | Sim | Justificativa do cancelamento (mín. 15 caracteres) |
| `CNPJ` | String(14) | Sim | CNPJ do emitente (somente dígitos) |
| `dhEvento` | String | Não | Data/hora do evento (padrão: data/hora atual) |
| `nSeqEvento` | Integer | Não | Número sequencial do evento (padrão: 1) |
| `cUF` | Integer | Não | Código da UF (extraído da chNFe se omitido) |
| `idLote` | Integer | Não | Identificador do lote (padrão: 1) |
| `includeSoap` | Boolean | Não | Incluir SOAP bruto na resposta (padrão: false) |
| `endpointOverride` | String | Não | URL personalizada do webservice SEFAZ |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "resultado": {
      "retEnvEvento": {
        "$": { "versao": "1.00", "xmlns": "http://www.portalfiscal.inf.br/nfe" },
        "idLote": "1",
        "tpAmb": "2",
        "verAplic": "SVRS202401010000",
        "cOrgao": "91",
        "cStat": "128",
        "xMotivo": "Lote de Evento Processado",
        "retEvento": {
          "infEvento": {
            "tpAmb": "2",
            "verAplic": "SVRS202401010000",
            "cOrgao": "91",
            "cStat": "135",
            "xMotivo": "Evento registrado e vinculado a NF-e",
            "chNFe": "35240112345678901234550010000000011000000019",
            "tpEvento": "110111",
            "xEvento": "Cancelamento registrado",
            "nSeqEvento": "1",
            "dhRegEvento": "2024-01-15T11:00:00-03:00",
            "nProt": "135240000000002"
          }
        }
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
    "code": "MISSING_NPROT",
    "message": "Campo nProt (protocolo de autorização) é obrigatório"
  }
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/nfe/cancelar \
  -H "X-API-Key: sua-api-key-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "ambiente": "homologacao",
    "chNFe": "35240112345678901234550010000000011000000019",
    "nProt": "135240000000001",
    "xJust": "Cancelamento solicitado por erro no pedido",
    "CNPJ": "12345678901234"
  }'
```

---

### 4. Inutilizar Numeração de NF-e

Inutiliza uma faixa de números de NF-e que não serão utilizados, via serviço NfeInutilizacao4.

> ⚠️ **Atenção:** A inutilização é irreversível. Certifique-se de que os números a serem inutilizados realmente não serão utilizados.

**Endpoint:** `POST /api/v1/nfe/inutilizar`

**Headers:**
```
X-API-Key: sua-api-key-aqui
Content-Type: application/json
```

**Body:**
```json
{
  "ambiente": "homologacao",
  "cUF": 35,
  "CNPJ": "12345678901234",
  "mod": 55,
  "serie": 1,
  "nNFIni": 100,
  "nNFFin": 110,
  "xJust": "Números não utilizados por erro de sistema"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ambiente` | String | Sim | `"homologacao"` ou `"producao"` |
| `cUF` | Integer | Sim | Código da UF (ver tabela de UFs) |
| `CNPJ` | String(14) | Sim | CNPJ do emitente (somente dígitos) |
| `mod` | Integer | Sim | Modelo: 55=NF-e, 65=NFC-e |
| `serie` | Integer | Sim | Série da NF-e |
| `nNFIni` | Integer | Sim | Número inicial da faixa a inutilizar |
| `nNFFin` | Integer | Sim | Número final da faixa a inutilizar |
| `xJust` | String | Sim | Justificativa (mín. 15 caracteres) |
| `ano` | Integer | Não | Ano da faixa (padrão: ano atual) |
| `includeSoap` | Boolean | Não | Incluir SOAP bruto na resposta (padrão: false) |
| `endpointOverride` | String | Não | URL personalizada do webservice SEFAZ |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "resultado": {
      "retInutNFe": {
        "$": { "versao": "4.00", "xmlns": "http://www.portalfiscal.inf.br/nfe" },
        "tpAmb": "2",
        "verAplic": "SVRS202401010000",
        "cStat": "102",
        "xMotivo": "Inutilização de número homologado",
        "cUF": "35",
        "infInut": {
          "tpAmb": "2",
          "verAplic": "SVRS202401010000",
          "cStat": "102",
          "xMotivo": "Inutilização de número homologado",
          "cUF": "35",
          "ano": "24",
          "CNPJ": "12345678901234",
          "mod": "55",
          "serie": "1",
          "nNFIni": "100",
          "nNFFin": "110",
          "dhRecbto": "2024-01-15T10:05:00-03:00",
          "nProt": "135240000000003"
        }
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
    "code": "MISSING_CUF",
    "message": "Campo cUF é obrigatório"
  }
}
```

**Exemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/nfe/inutilizar \
  -H "X-API-Key: sua-api-key-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "ambiente": "homologacao",
    "cUF": 35,
    "CNPJ": "12345678901234",
    "mod": 55,
    "serie": 1,
    "nNFIni": 100,
    "nNFFin": 110,
    "xJust": "Números não utilizados por erro de sistema"
  }'
```

---

## Estrutura de Dados

### ide (Identificação da NF-e)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cUF` | Integer | Sim | Código da UF do emitente (ver tabela de UFs) |
| `natOp` | String(60) | Sim | Natureza da operação (ex: "Venda de mercadoria") |
| `mod` | Integer | Sim | Modelo: 55=NF-e, 65=NFC-e |
| `serie` | Integer | Sim | Série da NF-e (0 a 889) |
| `nNF` | Integer | Sim | Número da NF-e (1 a 999999999) |
| `dhEmi` | String | Sim | Data/hora de emissão (formato: YYYY-MM-DDTHH:MM:SS±HH:MM) |
| `dhSaiEnt` | String | Não | Data/hora de saída/entrada |
| `tpNF` | Integer | Sim | Tipo: 0=Entrada, 1=Saída |
| `idDest` | Integer | Sim | Destino: 1=Interna, 2=Interestadual, 3=Exterior |
| `cMunFG` | Integer | Sim | Código do município do fato gerador (IBGE) |
| `tpImp` | Integer | Sim | Tipo de impressão DANFE: 1=Retrato, 2=Paisagem, 3=Simplificado, 4=NFC-e, 5=MSG eletrônica |
| `tpEmis` | Integer | Sim | Forma de emissão: 1=Normal, 2=FS, 3=SCAN, 4=DPEC, 5=FS-DA, 6=SVC-AN, 7=SVC-RS, 9=Off-Line NFC-e |
| `tpAmb` | Integer | Sim | Ambiente: 1=Produção, 2=Homologação (sobrescrito pelo campo `ambiente`) |
| `finNFe` | Integer | Sim | Finalidade: 1=Normal, 2=Complementar, 3=Ajuste, 4=Devolução |
| `indFinal` | Integer | Sim | Consumidor final: 0=Normal, 1=Consumidor final |
| `indPres` | Integer | Sim | Presença do comprador: 0=NA, 1=Presencial, 2=Internet, 3=Teleatendimento, 4=NFC-e em entrega, 5=Presencial fora do estabelecimento, 9=Outros |
| `indIntermed` | Integer | Não | Processo de intermediação: 0=Sem intermediador, 1=Marketplace |
| `procEmi` | Integer | Sim | Processo de emissão: 0=Emissão própria, 1=Avulsa, 2=Contribuinte, 3=Contribuinte ERP |
| `verProc` | String(20) | Sim | Versão do processo de emissão (ex: "1.0.0") |
| `cNF` | String(8) | Não | Código numérico da NF-e (gerado automaticamente se não informado) |
| `NFref` | Array | Não | Documentos fiscais referenciados |

### emit (Emitente)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `CNPJ` | String(14) | Sim* | CNPJ do emitente (somente dígitos) |
| `CPF` | String(11) | Sim* | CPF do emitente (somente dígitos) |
| `xNome` | String(60) | Sim | Razão Social / Nome do emitente |
| `xFant` | String(60) | Não | Nome fantasia |
| `enderEmit` | Object | Sim | Endereço do emitente (ver estrutura de endereço) |
| `IE` | String(14) | Sim | Inscrição Estadual |
| `IEST` | String(14) | Não | IE do Substituto Tributário |
| `IM` | String(15) | Não | Inscrição Municipal |
| `CNAE` | String(7) | Não | CNAE fiscal |
| `CRT` | Integer | Sim | Código Regime Tributário: 1=Simples Nacional, 2=Simples Nacional (excesso), 3=Regime Normal |

\* Informar CNPJ **ou** CPF

### dest (Destinatário)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `CNPJ` | String(14) | Sim* | CNPJ do destinatário (somente dígitos) |
| `CPF` | String(11) | Sim* | CPF do destinatário (somente dígitos) |
| `idEstrangeiro` | String(20) | Sim* | ID do comprador estrangeiro |
| `xNome` | String(60) | Não | Razão Social / Nome do destinatário |
| `enderDest` | Object | Não | Endereço do destinatário (ver estrutura de endereço) |
| `indIEDest` | Integer | Sim | Indicador da IE: 1=Contribuinte com IE, 2=Contribuinte isento, 9=Não contribuinte |
| `IE` | String(14) | Não | Inscrição Estadual (obrigatória se indIEDest=1) |
| `ISUF` | String(9) | Não | SUFRAMA |
| `IM` | String(15) | Não | Inscrição Municipal (para NF-e com ISSQN) |
| `email` | String(60) | Não | Email do destinatário |

\* Informar CNPJ, CPF **ou** idEstrangeiro

### Estrutura de Endereço (enderEmit / enderDest)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `xLgr` | String(60) | Sim | Logradouro |
| `nro` | String(60) | Sim | Número |
| `xCpl` | String(60) | Não | Complemento |
| `xBairro` | String(60) | Sim | Bairro |
| `cMun` | Integer(7) | Sim | Código do município (IBGE) |
| `xMun` | String(60) | Sim | Nome do município |
| `UF` | String(2) | Sim | Sigla da UF |
| `CEP` | String(8) | Não | CEP (somente dígitos) |
| `cPais` | Integer | Não | Código do país (Brasil: 1058) |
| `xPais` | String(60) | Não | Nome do país (ex: "Brasil") |
| `fone` | String(12) | Não | Telefone (somente dígitos) |

### det (Itens da NF-e)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `nItem` | Integer | Sim | Número do item (1 a 990) |
| `prod` | Object | Sim | Dados do produto/serviço |
| `imposto` | Object | Sim | Tributos do item |
| `infAdProd` | String(500) | Não | Informações adicionais do produto |

#### prod (Produto/Serviço)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `cProd` | String(60) | Sim | Código do produto/serviço |
| `cEAN` | String(14) | Sim | GTIN do produto (`"SEM GTIN"` se não houver) |
| `xProd` | String(120) | Sim | Descrição do produto/serviço |
| `NCM` | String(8) | Sim | Código NCM |
| `CFOP` | String(4) | Sim | Código Fiscal de Operações e Prestações |
| `uCom` | String(6) | Sim | Unidade comercial (ex: "UN", "KG", "CX") |
| `qCom` | Decimal(11,4) | Sim | Quantidade comercial |
| `vUnCom` | Decimal(21,10) | Sim | Valor unitário de comercialização |
| `vProd` | Decimal(13,2) | Sim | Valor total bruto do produto |
| `cEANTrib` | String(14) | Sim | GTIN da unidade tributável (`"SEM GTIN"` se não houver) |
| `uTrib` | String(6) | Sim | Unidade tributável |
| `qTrib` | Decimal(11,4) | Sim | Quantidade tributável |
| `vUnTrib` | Decimal(21,10) | Sim | Valor unitário tributável |
| `vFrete` | Decimal(13,2) | Não | Valor do frete |
| `vSeg` | Decimal(13,2) | Não | Valor do seguro |
| `vDesc` | Decimal(13,2) | Não | Valor do desconto |
| `vOutro` | Decimal(13,2) | Não | Outras despesas acessórias |
| `indTot` | Integer | Sim | Indica se valor compõe total da NF-e: 0=Não, 1=Sim |
| `CEST` | String(7) | Não | Código especificador da substituição tributária |
| `EXTIPI` | String(3) | Não | EX TIPI |
| `NCM` | String(8) | Sim | Código NCM sem pontos |

#### imposto (Tributos do Item)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `vTotTrib` | Decimal(13,2) | Não | Valor aproximado total de todos os impostos |
| `ICMS` | Object | Sim* | Grupo do ICMS (usar subgrupo: ICMS00, ICMS10, ..., ICMSSN101, etc.) |
| `ISSQN` | Object | Sim* | Grupo do ISSQN (para serviços) |
| `IPI` | Object | Não | Grupo do IPI |
| `II` | Object | Não | Grupo do Imposto de Importação |
| `PIS` | Object | Sim | Grupo do PIS (usar subgrupo: PISAliq, PISQtde, PISNT, PISOutr) |
| `COFINS` | Object | Sim | Grupo do COFINS (usar subgrupo: COFINSAliq, COFINSQtde, COFINSNT, COFINSOutr) |

\* Informar ICMS **ou** ISSQN conforme o tipo de operação

#### ICMS00 (Tributado Integralmente)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `orig` | Integer | Origem da mercadoria: 0=Nacional, 1=Estrangeira (importação direta), 2=Estrangeira (adquirida no mercado interno) |
| `CST` | String(2) | CST do ICMS: `"00"` |
| `modBC` | Integer | Modalidade BC: 0=Margem Valor Agregado, 1=Pauta, 2=Preço Tabelado Máx., 3=Valor Op. |
| `vBC` | Decimal | Base de Cálculo do ICMS |
| `pICMS` | Decimal | Alíquota do ICMS (%) |
| `vICMS` | Decimal | Valor do ICMS |
| `pRedBC` | Decimal | Percentual de Redução da BC (se aplicável) |

> 💡 Outros grupos ICMS disponíveis: ICMS10, ICMS20, ICMS30, ICMS40, ICMS41, ICMS50, ICMS51, ICMS60, ICMS70, ICMS90, ICMSSN101, ICMSSN102, ICMSSN201, ICMSSN202, ICMSSN500, ICMSSN900. Consulte o MOC NF-e v7.0 para detalhes de cada grupo.

### total (Totais da NF-e)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `ICMSTot.vBC` | Decimal | Sim | BC do ICMS |
| `ICMSTot.vICMS` | Decimal | Sim | Valor do ICMS |
| `ICMSTot.vICMSDeson` | Decimal | Sim | Valor do ICMS desonerado |
| `ICMSTot.vFCP` | Decimal | Sim | Valor total do FCP |
| `ICMSTot.vBCST` | Decimal | Sim | BC do ICMS ST |
| `ICMSTot.vST` | Decimal | Sim | Valor do ICMS ST |
| `ICMSTot.vFCPST` | Decimal | Sim | Valor total do FCP ST |
| `ICMSTot.vFCPSTRet` | Decimal | Sim | Valor total do FCP ST retido anteriormente |
| `ICMSTot.vProd` | Decimal | Sim | Valor total dos produtos |
| `ICMSTot.vFrete` | Decimal | Sim | Valor do frete |
| `ICMSTot.vSeg` | Decimal | Sim | Valor do seguro |
| `ICMSTot.vDesc` | Decimal | Sim | Valor do desconto |
| `ICMSTot.vII` | Decimal | Sim | Valor do Imposto de Importação |
| `ICMSTot.vIPI` | Decimal | Sim | Valor do IPI |
| `ICMSTot.vIPIDevol` | Decimal | Sim | Valor do IPI devolvido |
| `ICMSTot.vPIS` | Decimal | Sim | Valor do PIS |
| `ICMSTot.vCOFINS` | Decimal | Sim | Valor do COFINS |
| `ICMSTot.vOutro` | Decimal | Sim | Outras despesas acessórias |
| `ICMSTot.vNF` | Decimal | Sim | Valor total da NF-e |
| `ICMSTot.vTotTrib` | Decimal | Não | Valor aproximado total de tributos |

### transp (Transporte)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `modFrete` | Integer | Sim | Modal. frete: 0=Por conta do emitente, 1=Por conta do destinatário, 2=Por conta de terceiros, 9=Sem frete |
| `transporta` | Object | Não | Dados da transportadora |
| `retTransp` | Object | Não | Retenção de ICMS do transporte |
| `vol` | Array | Não | Dados dos volumes transportados |

### pag (Pagamento)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `detPag` | Array | Sim | Detalhes dos pagamentos |
| `detPag[].indPag` | Integer | Não | Indicador: 0=À vista, 1=A prazo |
| `detPag[].tPag` | String(2) | Sim | Forma de pagamento (ver tabela) |
| `detPag[].vPag` | Decimal | Sim | Valor do pagamento |
| `vTroco` | Decimal | Não | Valor do troco |

#### Formas de Pagamento (tPag)

| Código | Descrição |
|--------|-----------|
| `01` | Dinheiro |
| `02` | Cheque |
| `03` | Cartão de Crédito |
| `04` | Cartão de Débito |
| `05` | Crédito Loja |
| `10` | Vale Alimentação |
| `11` | Vale Refeição |
| `12` | Vale Presente |
| `13` | Vale Combustível |
| `14` | Duplicata Mercantil |
| `15` | Boleto Bancário |
| `16` | Depósito Bancário |
| `17` | Pagamento Instantâneo (PIX) |
| `18` | Transferência bancária, Carteira Digital |
| `19` | Programa de fidelidade, Cashback, Crédito Virtual |
| `90` | Sem pagamento |
| `99` | Outros |

---

## Tabela de Códigos UF (cUF)

| Código | UF | Estado |
|--------|----|--------|
| 12 | AC | Acre |
| 27 | AL | Alagoas |
| 16 | AP | Amapá |
| 13 | AM | Amazonas |
| 29 | BA | Bahia |
| 23 | CE | Ceará |
| 53 | DF | Distrito Federal |
| 32 | ES | Espírito Santo |
| 52 | GO | Goiás |
| 21 | MA | Maranhão |
| 51 | MT | Mato Grosso |
| 50 | MS | Mato Grosso do Sul |
| 31 | MG | Minas Gerais |
| 15 | PA | Pará |
| 25 | PB | Paraíba |
| 41 | PR | Paraná |
| 26 | PE | Pernambuco |
| 22 | PI | Piauí |
| 33 | RJ | Rio de Janeiro |
| 24 | RN | Rio Grande do Norte |
| 43 | RS | Rio Grande do Sul |
| 11 | RO | Rondônia |
| 14 | RR | Roraima |
| 42 | SC | Santa Catarina |
| 35 | SP | São Paulo |
| 28 | SE | Sergipe |
| 17 | TO | Tocantins |
| 91 | — | SVC-AN (Contingência Nacional) |
| 90 | — | SVRS (Contingência RS) |

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| `MISSING_AMBIENTE` | Campo `ambiente` não informado ou inválido |
| `MISSING_NFE` | Campo `nfe` não informado (emissão) |
| `MISSING_CHNFE` | Campo `chNFe` não informado (consulta/cancelamento) |
| `MISSING_NPROT` | Campo `nProt` não informado (cancelamento) |
| `MISSING_XJUST` | Campo `xJust` não informado (cancelamento/inutilização) |
| `MISSING_CNPJ` | Campo `CNPJ` não informado (cancelamento/inutilização) |
| `MISSING_CUF` | Campo `cUF` não informado (inutilização) |
| `MISSING_MOD` | Campo `mod` não informado (inutilização) |
| `MISSING_SERIE` | Campo `serie` não informado (inutilização) |
| `MISSING_NNFINI` | Campo `nNFIni` não informado (inutilização) |
| `MISSING_NNFFIN` | Campo `nNFFin` não informado (inutilização) |
| `INVALID_API_KEY` | API Key inválida ou não encontrada |

### Códigos de Status SEFAZ (cStat)

| cStat | Descrição |
|-------|-----------|
| `100` | Autorizado o uso da NF-e |
| `102` | Inutilização de número homologado |
| `104` | Lote processado |
| `110` | Uso denegado |
| `128` | Lote de Evento Processado |
| `135` | Evento registrado e vinculado a NF-e |
| `204` | Duplicidade de NF-e |
| `539` | Cancelamento homologado fora do prazo |
| `217` | NF-e não consta na base de dados da SEFAZ |

> Para a lista completa de códigos de status, consulte o MOC NF-e v7.0.

---

## Fluxo de Processamento

### Emissão de NF-e

1. **Recepção do JSON** - API recebe os dados completos da NF-e
2. **Validação** - Verifica campos obrigatórios (ambiente, nfe, ide, emit)
3. **Recuperação do Certificado** - Busca e descriptografa o certificado digital pela API Key
4. **Cálculo da Chave de Acesso** - Gera os campos `cNF` e `cDV` automaticamente
5. **Construção do XML** - Gera o XML NF-e v4.00 com namespace `http://www.portalfiscal.inf.br/nfe`
6. **Assinatura Digital** - Assina o XML com XML-DSig usando o certificado A1
7. **Envio SOAP** - Transmite ao webservice NFeAutorizacao4 via SOAP 1.2
8. **Processamento da Resposta** - Interpreta o retEnviNFe da SEFAZ
9. **Retorno JSON** - Retorna `chaveAcesso` e `resultado` ao cliente

### Consulta de NF-e

1. Valida a chave de acesso (44 dígitos)
2. Constrói o XML consSitNFe
3. Transmite ao NfeConsultaProtocolo4
4. Retorna o retConsSitNFe da SEFAZ

### Cancelamento de NF-e

1. Valida os campos obrigatórios (chNFe, nProt, xJust, CNPJ)
2. Constrói o XML envEvento com evento de cancelamento (tpEvento=110111)
3. Assina o evento interno com XML-DSig
4. Transmite ao NFeRecepcaoEvento4
5. Retorna o retEnvEvento da SEFAZ

### Inutilização de NF-e

1. Valida os campos obrigatórios (cUF, CNPJ, mod, serie, nNFIni, nNFFin, xJust)
2. Constrói o XML inutNFe
3. Assina com XML-DSig
4. Transmite ao NfeInutilizacao4
5. Retorna o retInutNFe da SEFAZ

---

## Ambientes SEFAZ

### Homologação

- Utilizar `"ambiente": "homologacao"` na requisição
- O campo `tpAmb` na NF-e é sobrescrito automaticamente para `2`
- **Endereço SP:** `https://homologacao.nfe.fazenda.sp.gov.br/ws/NfeAutorizacao4.asmx`
- **Endereço Nacional (SVC-AN):** `https://hom1.nfe.fazenda.gov.br`

### Produção

- Utilizar `"ambiente": "producao"` na requisição
- O campo `tpAmb` na NF-e é sobrescrito automaticamente para `1`
- **Endereço SP:** `https://nfe.fazenda.sp.gov.br/ws/NfeAutorizacao4.asmx`
- **Endereço Nacional (SVC-AN):** `https://nfe.fazenda.gov.br`

---

## Notas Importantes

1. ⚠️ **Certificado Digital:** É obrigatório ter um certificado digital A1 válido cadastrado na conta via `POST /api/v1/account/setup`
2. ⚠️ **Homologação CNPJ:** Em ambiente de homologação, utilize o CNPJ real do emitente; a SEFAZ valida o certificado
3. ⚠️ **xProd em Homologação:** Em homologação, a SEFAZ exige que o campo `xProd` contenha o texto `"NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"` para aprovação
4. ⚠️ **Chave de Acesso:** O campo `cNF` é calculado e o `cDV` verificado automaticamente pelo serviço
5. ⚠️ **tpAmb:** O campo `tpAmb` informado na NF-e é sobrescrito pelo campo `ambiente` da requisição
6. ℹ️ **Endpoint por UF:** O endpoint SEFAZ é selecionado automaticamente com base no `cUF` do emitente; use `endpointOverride` para forçar um URL específico
7. ℹ️ **indSinc:** No modo síncrono (indSinc=1, padrão), a resposta contém o resultado da autorização imediatamente; no modo assíncrono (indSinc=0), a resposta contém apenas o protocolo de recebimento

---

## Suporte

Para dúvidas sobre o layout e validações, consulte a documentação oficial:
- Manual de Orientação ao Contribuinte (MOC) NF-e v7.0 em `docs/nfe/`
- Schemas XSD em `docs/nfe/PL_010b_NT2025_002_v1.30/`
- [Portal Nacional da NF-e](https://www.nfe.fazenda.gov.br/)
