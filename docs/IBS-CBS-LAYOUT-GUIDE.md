# Guia de Uso - Suporte Completo a IBS/CBS no XML Builder

## Visão Geral

O xml-builder agora suporta conversão completa de IBS/CBS (Imposto sobre Bens e Serviços / Contribuição para Seguridade Social) conforme o layout NFe 4.00 (versão PL_010b_NT2025_002_v1.30).

## Estrutura Básica

Todos os campos de IBS/CBS são **opcionais** no JSON, pois nem todas as operações envolvem esses tributos. Quando presentes, devem seguir a estrutura descrita abaixo.

## 1. Campos no IDE (Identificação)

### cMunFGIBS
Campo já existente no IDE. Informar o município onde ocorreu o fato gerador de IBS/CBS.

```json
{
  "ide": {
    "cUF": "35",
    "cNF": "12345678",
    "cMunFGIBS": "3550308",
    ...
  }
}
```

## 2. Tributação de IBS/CBS no Detalhe do Produto

A tributação de IBS/CBS é informada dentro de `imposto.IBSCBS` no detalhe do item.

### Estrutura Básica

```json
{
  "det": [
    {
      "nItem": "1",
      "prod": { ... },
      "imposto": {
        "IBSCBS": {
          "CST": "000",
          "cClassTrib": "000000",
          "gIBSCBS": { ... },
          "gEstornoCred": { ... },
          "gCredPresOper": { ... }
        }
      }
    }
  ]
}
```

### Campos Obrigatórios

- **CST**: Código Situação Tributária (3 dígitos)
  - Exemplos: "000" (Operação Tributável), "100" (Operação Isenta), etc.
  
- **cClassTrib**: Classificação Tributária (6 dígitos)
  - Define a categoria da operação conforme tabela da NT

### Exemplos de CST/cClassTrib

```json
{
  // Operação Tributável Normal
  "CST": "000",
  "cClassTrib": "000000",
  
  // Operação Tributável com Redução de Base de Cálculo
  "CST": "020",
  "cClassTrib": "100000",
  
  // Operação Isenta
  "CST": "100",
  "cClassTrib": "200000"
}
```

## 3. Grupo gIBSCBS - Tributação Regular

Usado na maioria das operações de IBS/CBS.

### Exemplo Completo

```json
{
  "IBSCBS": {
    "CST": "000",
    "cClassTrib": "000000",
    "gIBSCBS": {
      "vBC": "1000.00",
      
      // IBS - Competência da UF
      "gIBSUF": {
        "pIBSUF": "7.65",
        "vIBSUF": "76.50"
      },
      
      // IBS - Competência Municipal
      "gIBSMun": {
        "pIBSMun": "2.00",
        "vIBSMun": "20.00"
      },
      
      // Total IBS
      "vIBS": "96.50",
      
      // CBS
      "gCBS": {
        "pCBS": "1.50",
        "vCBS": "15.00"
      }
    }
  }
}
```

### Com Diferimento

```json
{
  "gIBSCBS": {
    "vBC": "1000.00",
    "gIBSUF": {
      "pIBSUF": "7.65",
      "gDif": {
        "pDif": "100.0",        // Diferimento de 100%
        "vDif": "76.50"         // Valor diferido
      },
      "vIBSUF": "0.00"          // Valor = 0 pois foi diferido
    },
    ...
  }
}
```

### Com Devolução de Tributo

```json
{
  "gIBSCBS": {
    "vBC": "1000.00",
    "gIBSUF": {
      "pIBSUF": "7.65",
      "gDevTrib": {
        "vDevTrib": "38.25"     // Tributo devolvido
      },
      "vIBSUF": "38.25"         // Valor após devolução
    },
    ...
  }
}
```

### Com Redução de Alíquota

```json
{
  "gIBSCBS": {
    "vBC": "1000.00",
    "gIBSUF": {
      "pIBSUF": "7.65",
      "gRed": {
        "pRedAliq": "50.0",     // Redução de 50%
        "pAliqEfet": "3.825"    // Alíquota efetiva (7.65% - 50%)
      },
      "vIBSUF": "38.25"         // Valor com alíquota reduzida
    },
    ...
  }
}
```

## 4. Grupo gIBSCBSMono - Tributação Monofásica

Usado para operações monofásicas (CST 620).

```json
{
  "IBSCBS": {
    "CST": "620",
    "cClassTrib": "500000",
    "gIBSCBSMono": {
      // Monofasia Padrão
      "gMonoPadrao": {
        "qBCMono": "100.0000",   // Quantidade tributada
        "adRemIBS": "0.765",      // Alíquota ad rem IBS
        "adRemCBS": "0.015",      // Alíquota ad rem CBS
        "vIBSMono": "76.50",      // Valor IBS monofásico
        "vCBSMono": "1.50"        // Valor CBS monofásico
      },
      
      // Totais obrigatórios
      "vTotIBSMonoItem": "76.50",
      "vTotCBSMonoItem": "1.50"
    }
  }
}
```

### Monofasia com Retenção

```json
{
  "gIBSCBSMono": {
    "gMonoPadrao": { ... },
    
    // Monofasia Sujeita a Retenção
    "gMonoReten": {
      "qBCMonoReten": "50.0000",
      "adRemIBSReten": "0.765",
      "vIBSMonoReten": "38.25",
      "adRemCBSReten": "0.015",
      "vCBSMonoReten": "0.75"
    },
    
    "vTotIBSMonoItem": "76.50",
    "vTotCBSMonoItem": "1.50"
  }
}
```

## 5. Estorno de Crédito

```json
{
  "IBSCBS": {
    "CST": "000",
    "cClassTrib": "000000",
    "gIBSCBS": { ... },
    
    // Estorno de Crédito (opcional)
    "gEstornoCred": {
      "vIBSEstCred": "38.25",     // IBS estornado
      "vCBSEstCred": "0.75"       // CBS estornada
    }
  }
}
```

## 6. Crédito Presumido

### Opção 1: gCredPresOper

```json
{
  "IBSCBS": {
    "CST": "000",
    "cClassTrib": "000000",
    "gIBSCBS": { ... },
    
    "gCredPresOper": {
      "pCredPres": "50.0",        // Percentual do crédito
      "vCredPres": "38.25"        // Valor do crédito
    }
  }
}
```

### Opção 2: gCredPresIBSZFM (Zona Franca de Manaus)

```json
{
  "IBSCBS": {
    "CST": "000",
    "cClassTrib": "000000",
    "gIBSCBS": { ... },
    
    "gCredPresIBSZFM": {
      "tpCredPresIBSZFM": "0"     // Tipo de classificação (0-4)
    }
  }
}
```

## 7. Totais de IBS/CBS

Na seção `total`, incluir `IBSCBSTot` com os valores totalizados.

### Exemplo Completo

```json
{
  "total": {
    "ICMSTot": { ... },
    
    "IBSCBSTot": {
      "vBCIBSCBS": "10000.00",    // Base de cálculo total
      
      // Totalização do IBS
      "gIBS": {
        "gIBSUF": {
          "vDif": "0.00",         // Total diferimento
          "vDevTrib": "0.00",     // Total devoluções
          "vIBSUF": "765.00"      // Total IBS UF
        },
        "gIBSMun": {
          "vDif": "0.00",
          "vDevTrib": "0.00",
          "vIBSMun": "200.00"     // Total IBS Municipal
        },
        "vIBS": "965.00"          // Total IBS geral
      },
      
      // Totalização da CBS
      "gCBS": {
        "vDif": "0.00",
        "vDevTrib": "0.00",
        "vCBS": "150.00"          // Total CBS
      }
    }
  }
}
```

### Com Valores de Crédito Presumido

```json
{
  "IBSCBSTot": {
    "vBCIBSCBS": "10000.00",
    "gIBS": {
      "gIBSUF": { ... },
      "gIBSMun": { ... },
      "vIBS": "965.00",
      "vCredPres": "482.50",              // Crédito Presumido
      "vCredPresCondSus": "482.50"        // Crédito Presumido Condição Suspensiva
    },
    "gCBS": {
      "vDif": "0.00",
      "vDevTrib": "0.00",
      "vCBS": "150.00",
      "vCredPres": "75.00"
    }
  }
}
```

### Com Totais Monofásicos

```json
{
  "IBSCBSTot": {
    "vBCIBSCBS": "10000.00",
    "gIBS": { ... },
    "gCBS": { ... },
    
    // Totais da operação monofásica
    "gMono": {
      "vIBSMono": "765.00",           // Total IBS monofásico
      "vCBSMono": "150.00",           // Total CBS monofásico
      "vIBSMonoReten": "382.50",      // Total IBS sujeito a retenção
      "vCBSMonoReten": "75.00",       // Total CBS sujeita a retenção
      "vIBSMonoRet": "382.50",        // Total IBS retido
      "vCBSMonoRet": "75.00"          // Total CBS retida
    }
  }
}
```

### Com Estorno no Total

```json
{
  "IBSCBSTot": {
    "vBCIBSCBS": "10000.00",
    "gIBS": { ... },
    "gCBS": { ... },
    
    "gEstornoCred": {
      "vIBSEstCred": "482.50",        // Total IBS estornado
      "vCBSEstCred": "75.00"          // Total CBS estornada
    }
  }
}
```

## 8. Indicador de Doação

Quando a operação é de doação:

```json
{
  "IBSCBS": {
    "CST": "000",
    "cClassTrib": "000000",
    "indDoacao": "1",               // Operação de doação
    "gIBSCBS": { ... }
  }
}
```

## 9. Tributação Regular (gTribRegular)

Informar como seria a tributação caso não cumprida a condição resolutória/suspensiva:

```json
{
  "gIBSCBS": {
    "vBC": "1000.00",
    ...
    
    // Tributação Regular (como seria sem condição)
    "gTribRegular": {
      "CSTReg": "000",                    // CST regular
      "cClassTribReg": "000000",          // Classificação regular
      "pAliqEfetRegIBSUF": "7.65",        // Alíquota IBS UF regular
      "vTribRegIBSUF": "76.50",           // Valor IBS UF regular
      "pAliqEfetRegIBSMun": "2.00",       // Alíquota IBS Mun regular
      "vTribRegIBSMun": "20.00",          // Valor IBS Mun regular
      "pAliqEfetRegCBS": "1.50",          // Alíquota CBS regular
      "vTribRegCBS": "15.00"              // Valor CBS regular
    }
  }
}
```

## 10. Campo tpCredPresIBSZFM no Detalhe

Quando necessário classificar o crédito presumido em ZFM:

```json
{
  "imposto": {
    "IBSCBS": { ... },
    "tpCredPresIBSZFM": "0"     // Tipo de classificação (0-4)
  }
}
```

## Regras de Validação

1. **CST e cClassTrib** são obrigatórios quando IBSCBS está presente
2. **Apenas uma** das seguintes choices deve estar presente:
   - `gIBSCBS`
   - `gIBSCBSMono`
   - `gTransfCred` (será implementado)
   - `gAjusteCompet` (será implementado)

3. **Apenas uma** das seguintes choices pode estar presente:
   - `gCredPresOper`
   - `gCredPresIBSZFM`

4. Campos numéricos devem estar no formato correto:
   - Percentuais: até 4 casas decimais
   - Valores: até 2 casas decimais
   - Quantidades: até 4 casas decimais

## Mapping JSON → XML

O xml-builder converte a estrutura JSON para XML automaticamente, respeitando a ordem dos elementos conforme defini

do no XSD da NFe 4.00.

Exemplo:

```json
{
  "imposto": {
    "IBSCBS": {
      "CST": "000",
      "cClassTrib": "000000",
      "gIBSCBS": {
        "vBC": "100.00",
        "gIBSUF": {
          "pIBSUF": "7.65",
          "vIBSUF": "7.65"
        },
        "gIBSMun": {
          "pIBSMun": "2.00",
          "vIBSMun": "2.00"
        },
        "vIBS": "9.65",
        "gCBS": {
          "pCBS": "1.50",
          "vCBS": "1.50"
        }
      }
    }
  }
}
```

Gera:

```xml
<imposto>
  <IBSCBS>
    <CST>000</CST>
    <cClassTrib>000000</cClassTrib>
    <gIBSCBS>
      <vBC>100.00</vBC>
      <gIBSUF>
        <pIBSUF>7.65</pIBSUF>
        <vIBSUF>7.65</vIBSUF>
      </gIBSUF>
      <gIBSMun>
        <pIBSMun>2.00</pIBSMun>
        <vIBSMun>2.00</vIBSMun>
      </gIBSMun>
      <vIBS>9.65</vIBS>
      <gCBS>
        <pCBS>1.50</pCBS>
        <vCBS>1.50</vCBS>
      </gCBS>
    </gIBSCBS>
  </IBSCBS>
</imposto>
```

## Referências

- Schema XSD: [leiauteNFe_v4.00.xsd](../../docs/nfe/PL_010b_NT2025_002_v1.30/leiauteNFe_v4.00.xsd)
- Tipos Básicos: [DFeTiposBasicos_v1.00.xsd](../../docs/nfe/PL_010b_NT2025_002_v1.30/DFeTiposBasicos_v1.00.xsd)
- Análise Detalhada: [ANALISE-IBS-CBS-REFACTORING.md](../ANALISE-IBS-CBS-REFACTORING.md)
