# Debug: Resolver Parsing de ResultadoOperacao

## 🔍 Problema Identificado

O parsing da função `parseResultadoOperacaoXml()` está retornando campos vazios/null ao invés de preencher com os dados do XML.

## ✅ Melhorias Implementadas

1. **Mudança em `explicitArray`**: De `true` para `false`
   - Evita criar arrays desnecessários ao parsear XML
   - Simplifica a navegação da estrutura

2. **Remoção de Namespaces**: Adicionado `removeNamespaces: true`
   - Resolve problemas com prefixos de namespace (ex: `tns:ChaveNFe`)
   - Normaliza tags para forma simples

3. **Função Auxiliar `getXmlValue()`**:
   - Busca valores de forma segura em objetos XML parseados
   - Lida com diferentes estruturas de namespace
   - Faz fallback entre diferentes caminhos

4. **Logs Detalhados**:
   - Mostra estrutura parseada completa
   - Rastreia cada chave sendo processada
   - Ajuda a identificar onde falha o parsing

## 🧪 Como Testar

### 1. Ativar Debug Mode

Certifique-se que seu `.env` tem:
```env
NFSE_SP_DEBUG=true
```

### 2. Rodar Consulta de Protocolo

Faça uma requisição POST para:
```bash
curl -X POST http://localhost:3000/api/v1/nfse/sp/consulta-protocolo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "layoutVersion": "v01-1",
    "cpfCnpjRemetente": {
      "cnpj": "52507723000185",
      "cpf": null
    },
    "numeroProtocolo": "123456789"
  }'
```

### 3. Verificar Logs no Console

Com DEBUG ativo, você verá logs como:

```
=== RESULTADO OPERACAO XML PARSEADO ===
{
  "RetornoEnvioLoteRPS": {
    "Cabecalho": { ... },
    "ChaveNFeRPS": [ ... ]
  }
}
=== FIM RESULTADO OPERACAO ===

Root element encontrado: ["Cabecalho", "ChaveNFeRPS", ...]
ChaveNFeRPS encontrado: true
Quantidade de chaves: 1
Estrutura de chaves: [...]
```

## 📊 O que Procurar nos Logs

### ✓ Se Funcionou:
```
ChaveNFeRPS encontrado: true
Quantidade de chaves: 1
Resultado final parseado: {
  "cabecalho": { "sucesso": true, ... },
  "chavesNFeRPS": [{ "numeroNFe": "511", ... }],
  ...
}
```

### ✗ Se Não Funcionou:
```
ChaveNFeRPS não encontrado em root. Chaves disponíveis: [...]
Cabecalho não encontrado
Resultado final parseado: {
  "cabecalho": null,
  "chavesNFeRPS": [],
  ...
}
```

## 🐛 Se Ainda Não Funcionar

Compartilhe os logs completos, especialmente:

1. **Estrutura parseada**: O output de "RESULTADO OPERACAO XML PARSEADO"
2. **Chaves encontradas**: O output de "Root element encontrado"
3. **Estrutura de chaves**: O output de "Estrutura de chaves"

## 🔧 Alterações no Código

**Arquivo**: `src/services/nfse/sp/sao-paulo/soap-client.service.js`

### Mudanças na Configuração do Parser:

**Antes**:
```javascript
const parser = new xml2js.Parser({
  explicitArray: true,
  ignoreAttrs: false,
  tagNameProcessors: [xml2js.processors.stripPrefix],
});
```

**Depois**:
```javascript
const parser = new xml2js.Parser({
  explicitArray: false,           // ← Mudança
  ignoreAttrs: false,
  removeNamespaces: true,         // ← Adicionado
  tagNameProcessors: [xml2js.processors.stripPrefix],
});
```

### Nova Função Auxiliar:

```javascript
function getXmlValue(obj, key) {
  // Busca valor de forma segura
  // Funciona com arrays e objetos
  // Lida com namespaces
}
```

## 📝 Próximas Ações

1. Rode teste com `NFSE_SP_DEBUG=true`
2. Compartilhe os logs no console
3. Se funcionar → ✅ Problema resolvido!
4. Se não → Usamos os logs para debug mais profundo

## 💡 Notas Importantes

- Os logs só aparecem se `NFSE_SP_DEBUG=true`
- Verifique se está rodando em desenvolvimento (não comprimido/minificado)
- Limpe cache se estiver usando em servidor remoto
- Confirme que a API está usando a versão atualizada do código

---

**Última Atualização**: 18 de fevereiro de 2026
