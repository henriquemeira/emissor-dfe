# Análise da Refatoração - Suporte Completo a IBS/CBS

## Objetivo
Implementar suporte completo para IBS/CBS no xml-builder conforme layout NFe 4.00, contemplando todos os grupos e campos definidos nos esquemas XSD.

## Estruturas a Implementar

### 1. Grupo Básico de Diferimento (TDif)
**Onde**: Em gIBSUF/gCBS de TCIBS
**Campos**:
- `pDif`: Percentual do diferimento (TDec_0302_04RTC)
- `vDif`: Valor do diferimento (TDec1302RTC)

### 2. Grupo Devolução de Tributo (TDevTrib)
**Onde**: Em gIBSUF/gCBS de TCIBS
**Campos**:
- `vDevTrib`: Valor do tributo devolvido (TDec1302RTC)

### 3. Grupo Redução de Alíquota (TRed)
**Onde**: Em gIBSUF/gCBS de TCIBS
**Campos**:
- `pRedAliq`: Percentual de redução de alíquota (TDec_0302_04RTC)
- `pAliqEfet`: Alíquota Efetiva (TDec_0302_04RTC)

### 4. Grupo Crédito Presumido (TCredPres)
**Onde**: Em gCredPresOper de TTribNFe
**Campos**:
- `pCredPres`: Percentual do Crédito Presumido (TDec_0302_04RTC)
- `vCredPres` OU `vCredPresCondSus`: Valor do crédito ou valor com condição suspensiva (TDec1302RTC)

### 5. Grupo Tributação Regular (TTribRegular)
**Onde**: Em gTribRegular de TCIBS (opcional)
**Campos**:
- `CSTReg`: CST regular (TCST)
- `cClassTribReg`: Classificação Tributária Regular (TcClassTrib)
- `pAliqEfetRegIBSUF`: Alíquota IBS UF (TDec_0302_04RTC)
- `vTribRegIBSUF`: Valor IBS UF (TDec1302RTC)
- `pAliqEfetRegIBSMun`: Alíquota IBS Município (TDec_0302_04RTC)
- `vTribRegIBSMun`: Valor IBS Município (TDec1302RTC)
- `pAliqEfetRegCBS`: Alíquota CBS (TDec_0302_04RTC)
- `vTribRegCBS`: Valor CBS (TDec1302RTC)

### 6. Grupo Monofasia (TMonofasia)
**Onde**: Em gIBSCBSMono de TTribNFe (alternativa a gIBSCBS)
**Sub-grupos** (todos opcionais):
- `gMonoPadrao`: Monofasia padrão
  - `qBCMono`: Quantidade tributada (TDec1104RTC)
  - `adRemIBS`: Alíquota ad rem IBS (TDec_0302_04RTC)
  - `adRemCBS`: Alíquota ad rem CBS (TDec_0302_04RTC)
  - `vIBSMono`: Valor IBS (TDec1302RTC)
  - `vCBSMono`: Valor CBS (TDec1302RTC)
- `gMonoReten`: Monofasia sujeita a retenção
- `gMonoRet`: Monofasia retida anteriormente
- `gMonoDif`: Diferimento da monofasia
- `vTotIBSMonoItem`: Total IBS item (TDec1302RTC)
- `vTotCBSMonoItem`: Total CBS item (TDec1302RTC)

### 7. Grupo IBS/CBS Completo (TCIBS)
**Onde**: Dentro de gIBSCBS em imposto.IBSCBS (para produto/item)
**Estrutura**:
- `vBC`: Valor da Base de Cálculo (TDec1302RTC) - OBRIGATÓRIO
- `gIBSUF`: Grupo IBS - Competência UF
  - `pIBSUF`: Alíquota IBS UF (TDec_0302_04RTC) - OBRIGATÓRIO
  - `gDif`: Diferimento (opcional)
  - `gDevTrib`: Devolução (opcional)
  - `gRed`: Redução (opcional)
  - `vIBSUF`: Valor IBS UF (TDec1302RTC) - OBRIGATÓRIO
- `gIBSMun`: Grupo IBS - Competência Municipal
  - `pIBSMun`: Alíquota IBS Mun (TDec_0302_04RTC) - OBRIGATÓRIO
  - `gDif`: Diferimento (opcional)
  - `gDevTrib`: Devolução (opcional)
  - `gRed`: Redução (opcional)
  - `vIBSMun`: Valor IBS Mun (TDec1302RTC) - OBRIGATÓRIO
- `vIBS`: Valor Total IBS (TDec1302RTC) - OBRIGATÓRIO
- `gCBS`: Grupo CBS
  - `pCBS`: Alíquota CBS (TDec_0302_04RTC) - OBRIGATÓRIO
  - `gDif`: Diferimento (opcional)
  - `gDevTrib`: Devolução (opcional)
  - `gRed`: Redução (opcional)
  - `vCBS`: Valor CBS (TDec1302RTC) - OBRIGATÓRIO
- `gTribRegular`: Tributação Regular (opcional)
- `gTribCompraGov`: Tributação Compra Governamental (opcional)

### 8. Totais IBS/CBS (IBSCBSTot)
**Onde**: Em total.IBSCBSTot (na seção total da NFe)
**Estrutura**:
- `vBCIBSCBS`: Total Base de Cálculo (TDec1302RTC)
- `gIBS`: Grupo totais IBS
  - `gIBSUF`: IBS por UF
    - `vDif`: Total Diferimento
    - `vDevTrib`: Total Devoluções
    - `vIBSUF`: Total IBS UF
  - `gIBSMun`: IBS por Município
    - `vDif`: Total Diferimento
    - `vDevTrib`: Total Devoluções
    - `vIBSMun`: Total IBS Mun
  - `vIBS`: Total IBS
  - `vCredPres`: Total Crédito Presumido
  - `vCredPresCondSus`: Total Crédito Presumido Condição Suspensiva
- `gCBS`: Grupo totais CBS
  - `vDif`: Total Diferimento
  - `vDevTrib`: Total Devoluções
  - `vCBS`: Total CBS
  - `vCredPres`: Total Crédito Presumido
  - `vCredPresCondSus`: Total Crédito Presumido Condição Suspensiva
- `gMono`: Totais Monofasia (opcional)
  - `vIBSMono`: Total IBS Monofásico
  - `vCBSMono`: Total CBS Monofásico
  - `vIBSMonoReten`: Total IBS sujeito a retenção
  - `vCBSMonoReten`: Total CBS sujeita a retenção
  - `vIBSMonoRet`: Total IBS retido
  - `vCBSMonoRet`: Total CBS retida
- `gEstornoCred`: Totalização estorno
- `vTotTrib`: Valor total da NF com IBS/CBS/IS (soma por fora)

### 9. Estorno de Crédito (TEstornoCred)
**Onde**: Em gEstornoCred de TTribNFe (opcional)
**Campos**:
- `vIBSEstCred`: Valor IBS estornado (TDec1302RTC)
- `vCBSEstCred`: Valor CBS estornada (TDec1302RTC)

### 10. Crédito Presumido IBS ZFM (TCredPresIBSZFM)
**Onde**: Em gCredPresIBSZFM de TTribNFe (alternativa a gCredPresOper)
**Campos**:
- `tpCredPresIBSZFM`: Tipo de classificação (TTpCredPresIBSZFM) com valores 0-4
- Informado conforme indicador no cClassTrib

## Campos Adicionais em Imposto do Detalhe

### No detalhe do produto (buildDet/buildImposto):
1. **IBSCBS** (opcional): Grupo IBS/CBS completo
2. **tpCredPresIBSZFM** (opcional): Classificação para crédito presumido em ZFM

## Campos no IDE

### Já implementado:
- `cMunFGIBS`: Município de ocorrência do fato gerador de IBS/CBS

## Campos Tributários (TTribNFe)

### Novos campos a incluir no detalhe:
1. **CST** (OBRIGATÓRIO): Código Situação Tributária IBS/CBS (3 dígitos)
2. **cClassTrib** (OBRIGATÓRIO): Classificação Tributária IBS/CBS (6 dígitos)
3. **indDoacao** (opcional): Indicador de Doação
4. **gIBSCBS** OU **gIBSCBSMono** OU **gTransfCred** OU **gAjusteCompet** (choice)
5. **gEstornoCred** (opcional)
6. **gCredPresOper** OU **gCredPresIBSZFM** (choice)

## Mapeamento JSON -> XML Esperado

### Exemplo de Detalhe com IBS/CBS:
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

### Exemplo de Totais com IBS/CBS:
```json
{
  "total": {
    "IBSCBSTot": {
      "vBCIBSCBS": "1000.00",
      "gIBS": {
        "gIBSUF": {
          "vDif": "0.00",
          "vDevTrib": "0.00",
          "vIBSUF": "76.50"
        },
        "gIBSMun": {
          "vDif": "0.00",
          "vDevTrib": "0.00",
          "vIBSMun": "20.00"
        },
        "vIBS": "96.50"
      },
      "gCBS": {
        "vDif": "0.00",
        "vDevTrib": "0.00",
        "vCBS": "15.00"
      }
    }
  }
}
```

## Plano de Implementação

1. ✅ Criar branch feature/ibs-cbs-full-support
2. [ ] Implementar funções helper para construir grupos IBS/CBS
3. [ ] Refatorar buildImposto para suportar IBSCBS no detalhe
4. [ ] Refatorar buildTotal para suportar IBSCBSTot
5. [ ] Documentar a nova estrutura com exemplos
6. [ ] Testar com exemplos reais
7. [ ] Criar PR para repositório remoto

## Arquivos a Modificar

- `/home/henrique/workspace/github/emissor-dfe/src/services/nfe/xml-builder.service.js`

## Esquemas de Referência

- `/home/henrique/workspace/github/emissor-dfe/docs/nfe/PL_010b_NT2025_002_v1.30/DFeTiposBasicos_v1.00.xsd`
- `/home/henrique/workspace/github/emissor-dfe/docs/nfe/PL_010b_NT2025_002_v1.30/leiauteNFe_v4.00.xsd`
