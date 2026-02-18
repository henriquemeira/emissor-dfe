# NFSe São Paulo - Cancelamento de NFS-e

## Visão Geral

Esta funcionalidade implementa o cancelamento de NFS-e (Nota Fiscal de Serviço Eletrônica) para o município de São Paulo, conforme especificado na Fase 2 - NFS-e.

## Método Implementado

### CancelamentoNFe (Síncrono)

Cancela uma ou mais NFS-e previamente emitidas.

**Endpoint:** `POST /api/v1/nfse/sp/sao-paulo/cancelamento-nfe`

**Características:**
- Método síncrono (retorna resultado imediatamente)
- Permite cancelar até 50 NFS-e por requisição
- Utiliza o endpoint SOAP do serviço: `https://nfews.prefeitura.sp.gov.br/lotenfe.asmx`
- Requer autenticação via certificado digital (mTLS)

## Estrutura da Requisição

```json
{
  "layoutVersion": "v01-1",
  "ambiente": "teste" | "producao",
  "cancelamento": {
    "cabecalho": {
      "cpfCnpjRemetente": {
        "cnpj": "12345678901234"
      },
      "transacao": true
    },
    "detalhes": [
      {
        "chaveNFe": {
          "inscricaoPrestador": 12345678,
          "numeroNFe": 123456,
          "codigoVerificacao": "ABCD1234"
        }
      }
    ]
  }
}
```

### Parâmetros

#### Cabeçalho da Requisição
- **layoutVersion** (string, obrigatório): Versão do layout (sempre "v01-1")
- **ambiente** (string, opcional): "teste" ou "producao" (padrão: "teste")
- **includeSoap** (boolean, opcional): Incluir SOAP request/response na resposta (padrão: true)

#### Cancelamento
- **cabecalho.cpfCnpjRemetente** (object, obrigatório): CPF ou CNPJ do remetente autorizado
  - **cnpj** (string): CNPJ com 14 dígitos
  - **cpf** (string): CPF com 11 dígitos
- **cabecalho.transacao** (boolean, opcional): Modo de transação (padrão: true)
  - `true`: Todas as NFS-e só serão canceladas se não ocorrer erro em nenhuma (transação atômica)
  - `false`: NFS-e aptas serão canceladas mesmo que ocorram erros em outras

#### Detalhes (array, 1-50 itens)
- **chaveNFe.inscricaoPrestador** (number, obrigatório): Inscrição municipal (CCM) do prestador (8 dígitos)
- **chaveNFe.numeroNFe** (number, obrigatório): Número da NFS-e a cancelar
- **chaveNFe.codigoVerificacao** (string, opcional): Código de verificação da NFS-e

## Estrutura da Resposta

### Resposta de Sucesso

```json
{
  "success": true,
  "data": {
    "success": true,
    "layoutVersion": "v01-1",
    "resultado": {
      "sucesso": true,
      "alertas": [],
      "erros": []
    },
    "soap": {
      "compression": "gzip",
      "encoding": "base64",
      "request": "...",
      "response": "...",
      "sizes": {
        "requestBytes": 1234,
        "responseBytes": 5678,
        "requestCompressedBytes": 234,
        "responseCompressedBytes": 567
      }
    }
  }
}
```

### Resposta com Erros

```json
{
  "success": true,
  "data": {
    "success": true,
    "layoutVersion": "v01-1",
    "resultado": {
      "sucesso": false,
      "erros": [
        {
          "codigo": "001",
          "descricao": "NFS-e não encontrada ou já cancelada"
        }
      ]
    }
  }
}
```

## Processo de Cancelamento

1. **Validação dos dados**: O serviço valida todos os campos obrigatórios
2. **Assinatura dos cancelamentos**: Cada NFS-e recebe uma assinatura de cancelamento individual
   - String de 20 caracteres: Inscrição (8) + Número NFS-e (12)
   - Assinatura digital SHA-1 com certificado do prestador
3. **Montagem do XML**: Construção do XML PedidoCancelamentoNFe
4. **Assinatura do lote**: Assinatura digital XML do lote completo
5. **Transmissão**: Envio via SOAP para o web service da prefeitura
6. **Processamento**: Retorno síncrono com resultado do cancelamento

## Schemas XML

Os schemas utilizados estão em:
- **Pedido**: `docs/nfse/SP/Sao_Paulo/schemas-reformatributaria-v02-4/PedidoCancelamentoNFe_v02.xsd`
- **Retorno**: `docs/nfse/SP/Sao_Paulo/schemas-reformatributaria-v02-4/RetornoCancelamentoNFe_v02.xsd`
- **WSDL**: `docs/nfse/SP/Sao_Paulo/nfews.prefeitura.sp.gov.br_lotenfe.asmx_WSDL.xml`

## Exemplo de Uso

Ver arquivo: `tests/cancelamento-nfse-exemplo.txt`

```bash
curl -X POST http://localhost:3000/api/v1/nfse/sp/sao-paulo/cancelamento-nfe \
  -H "X-API-Key: sua-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "layoutVersion": "v01-1",
    "ambiente": "teste",
    "cancelamento": {
      "cabecalho": {
        "cpfCnpjRemetente": {
          "cnpj": "12345678901234"
        },
        "transacao": true
      },
      "detalhes": [
        {
          "chaveNFe": {
            "inscricaoPrestador": 12345678,
            "numeroNFe": 123456
          }
        }
      ]
    }
  }'
```

## Limitações

- Máximo de 50 NFS-e por requisição
- Apenas NFS-e emitidas pelo próprio prestador podem ser canceladas
- O certificado digital usado deve ser o mesmo usado na emissão da NFS-e
- Somente NFS-e não canceladas podem ser canceladas

## Segurança

- Autenticação via API Key (header `X-API-Key`)
- Certificado digital (mTLS) para comunicação com web service
- Assinatura digital SHA-1 para cada cancelamento individual
- Assinatura digital XML do lote completo

## Arquivos Modificados

1. `src/services/nfse/sp/sao-paulo/xml-builder.service.js`
   - Adicionado `buildPedidoCancelamentoNFe()`
   - Adicionado `buildChaveNFe()`

2. `src/services/nfse/sp/sao-paulo/signature.service.js`
   - Adicionado `signCancelamento()`
   - Adicionado `buildCancelamentoStringToSign()`

3. `src/services/nfse/sp/sao-paulo/soap-client.service.js`
   - Adicionado `cancelamentoNFe()`
   - Adicionado `parseSoapResponseCancelamentoNFe()`
   - Adicionado `parseRetornoCancelamentoNFe()`
   - Modificado `buildSoapEnvelopeSyncBatch()` para aceitar nome da operação

4. `src/services/nfse/sp/sao-paulo/nfse-sp.service.js`
   - Adicionado `cancelarNFe()`
   - Adicionado `signAllCancelamentos()`
   - Adicionado `validateCancelamentoData()`
   - Adicionado `validateCancelamentoDetalhe()`

5. `src/controllers/nfse-sp.controller.js`
   - Adicionado `cancelarNFe()`

6. `src/routes/nfse-sp.routes.js`
   - Adicionado rota `POST /cancelamento-nfe`

## Referências

- Manual de Integração NFSe São Paulo
- Documentação da Reforma Tributária v02-4
- WSDL do Web Service da Prefeitura de São Paulo
