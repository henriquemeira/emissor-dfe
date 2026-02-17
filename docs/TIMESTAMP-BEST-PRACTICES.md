# Boas Práticas para Timestamps na API

## Contexto

A API Emissor DFe utiliza timestamps no formato ISO 8601 com UTC (Coordinated Universal Time) para todos os campos de data/hora, incluindo `criadoEm` e `atualizadoEm`.

## Por que usar UTC?

### ✅ Vantagens de armazenar em UTC

1. **Independência de Timezone**: Os dados são armazenados sem depender de configurações locais de servidor
2. **Evita ambiguidade**: Não há confusão durante transições de horário de verão
3. **Padrão internacional**: ISO 8601 com UTC é o padrão mais aceito em APIs REST
4. **Facilita conversões**: Qualquer cliente pode converter para seu timezone local
5. **Compatibilidade**: Bancos de dados e sistemas geralmente preferem UTC internamente
6. **Auditoria**: Permite rastreamento consistente independente de onde os dados são acessados

### ❌ Problemas de armazenar em timezone local

1. **Ambiguidade no horário de verão**: Durante a transição, uma hora pode ocorrer duas vezes
2. **Dependência de configuração**: Mudanças no timezone do servidor afetam os dados
3. **Dificuldade em operações**: Comparações e cálculos de diferença entre datas ficam complexos
4. **Problemas de migração**: Se o servidor mudar de localização, os timestamps ficam inconsistentes

## Como funciona atualmente

### Armazenamento (Backend)

```javascript
// Exemplo em src/controllers/account.controller.js
const accountData = {
  metadata: {
    criadoEm: new Date().toISOString(),      // "2026-02-17T14:30:00.000Z"
    atualizadoEm: new Date().toISOString(),  // "2026-02-17T14:30:00.000Z"
  }
};
```

O método `toISOString()` sempre retorna:
- Formato: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Timezone: UTC (indicado pelo `Z` no final)
- Exemplo: `2026-02-17T14:30:00.000Z`

### Apresentação (Frontend)

O frontend pode converter para o timezone local do usuário:

```javascript
// JavaScript no navegador
const timestamp = "2026-02-17T14:30:00.000Z";
const date = new Date(timestamp);

// Horário local do usuário
console.log(date.toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo' 
}));
// Saída: "17/02/2026, 11:30:00" (UTC-3 - horário padrão do Brasil desde 2019)
// Nota: Quando havia horário de verão (até 2019), era UTC-2 durante o verão
```

## Recomendação: Manter UTC

**A prática atual de usar UTC é a CORRETA e recomendada.**

### Quando converter para timezone local

A conversão deve ser feita APENAS na camada de apresentação:

1. **No Frontend**: Quando exibir dados para o usuário
2. **Em Relatórios**: Quando gerar documentos para impressão
3. **Em Emails**: Quando enviar notificações

### Nunca converter no armazenamento

- ❌ Não armazene timestamps em timezone local no banco/arquivo
- ❌ Não converta timestamps de UTC para local antes de salvar
- ✅ Sempre salve em UTC usando `toISOString()`
- ✅ Converta apenas na apresentação final ao usuário

## Exemplos Práticos

### Backend (API) - Sempre UTC

```javascript
// ✅ CORRETO: Armazenar em UTC
const account = {
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString()
};

// ❌ INCORRETO: Armazenar em timezone local
const account = {
  criadoEm: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
};
```

### Frontend - Converter para visualização

```javascript
// ✅ CORRETO: Converter na apresentação
function formatarData(isoString) {
  return new Date(isoString).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Uso
const conta = await fetch('/api/v1/account/status');
console.log('Criada em:', formatarData(conta.data.conta.criadaEm));
```

### React Component Exemplo

```jsx
function DataHora({ timestamp }) {
  const dataFormatada = new Date(timestamp).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short'
  });
  
  return <span>{dataFormatada}</span>;
}

// Uso
<DataHora timestamp={conta.criadaEm} />
```

## Timezone do Brasil

O Brasil possui 4 fusos horários:

| Timezone | Estados | UTC Offset (Atual) | UTC Offset (Verão - até 2019) |
|----------|---------|---------------------|---------------------|
| America/Sao_Paulo | SP, RJ, MG, etc. | UTC-3 | UTC-2 (histórico) |
| America/Manaus | AM, RR, RO, etc. | UTC-4 | UTC-4 (sem horário de verão) |
| America/Fortaleza | CE, MA, PI, etc. | UTC-3 | UTC-3 (sem horário de verão) |
| America/Noronha | Fernando de Noronha | UTC-2 | UTC-2 (sem horário de verão) |

**Nota**: O horário de verão foi abolido no Brasil em 2019, mas o suporte permanece no timezone database para dados históricos.

## Conversão Manual (se necessário)

Se você precisar converter timestamps manualmente no backend (para logs, por exemplo):

```javascript
// Utilitário para formatar em horário de Brasília
function formatarHorarioBrasilia(date = new Date()) {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Uso em logs (somente para visualização)
console.log(`[${formatarHorarioBrasilia()}] Conta criada com sucesso`);
```

## Conclusão

✅ **Mantenha a prática atual**: Continue usando `new Date().toISOString()` para armazenar timestamps

✅ **Armazene sempre em UTC**: É a melhor prática reconhecida internacionalmente

✅ **Converta na apresentação**: Deixe a conversão para timezone local para o frontend

✅ **Documente**: Deixe claro na documentação da API que os timestamps estão em UTC

❌ **Não mude para timezone local**: Isso causaria mais problemas do que solucionaria

## Referências

- [ISO 8601 - Wikipedia](https://en.wikipedia.org/wiki/ISO_8601)
- [MDN - Date.prototype.toISOString()](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [Best Practices for REST API Date/Time](https://stackoverflow.com/questions/10286204/what-is-the-right-json-date-format)
