# Guia de Deploy no Vercel

Este guia descreve como realizar o deploy da API Emissor DFe no [Vercel](https://vercel.com), aproveitando o **Vercel Blob Storage** (1 GB gratuito no plano Hobby) para persistência dos dados.

## Por que Vercel?

| Recurso | Vercel (Hobby) | Render.com (Free) |
|---------|---------------|-------------------|
| Blob Storage | ✅ 1 GB gratuito | ❌ Sistema de arquivos efêmero |
| HTTPS automático | ✅ | ✅ |
| Deploy automático (GitHub) | ✅ | ✅ |
| Sleep em inatividade | ❌ Funções serverless | ✅ Dorme após 15 min |
| Domínio customizado | ✅ | ✅ |

O **Vercel Blob Storage** é fundamental para este projeto, pois os certificados digitais criptografados precisam persistir entre os deploys e reinicializações do servidor.

## Pré-requisitos

- Conta no GitHub com o repositório do projeto
- Conta no [Vercel](https://vercel.com) (pode usar login com GitHub)

## Passo a Passo

### 1. Importar o Projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **"Import Git Repository"**
3. Selecione o repositório `henriquemeira/emissor-dfe`
4. Clique em **"Import"**

### 2. Configurar o Projeto

Na tela de configuração do projeto:

- **Framework Preset**: `Other`
- **Root Directory**: `.` (raiz do projeto)
- **Build Command**: *(deixe em branco ou use `npm install`)*
- **Output Directory**: *(deixe em branco)*
- **Install Command**: `npm install`

> O arquivo `vercel.json` já está configurado no repositório e será detectado automaticamente.

### 3. Configurar o Vercel Blob Storage

1. Após criar o projeto, acesse o painel do projeto no Vercel
2. Vá em **"Storage"** > **"Create Database"**
3. Selecione **"Blob"**
4. Dê um nome ao store (ex: `emissor-dfe-data`)
5. Clique em **"Create"**
6. O Vercel irá adicionar automaticamente a variável de ambiente `BLOB_READ_WRITE_TOKEN` ao projeto

### 4. Configurar Variáveis de Ambiente

Acesse **Settings > Environment Variables** e adicione:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `NODE_ENV` | `production` | Modo de execução |
| `ENCRYPTION_KEY` | `[string aleatória 32+ chars]` | Chave mestra de criptografia |
| `ALLOWED_ORIGINS` | `https://seuapp.com` | Origens CORS permitidas (separadas por vírgula) |
| `STORAGE_DRIVER` | `blob` | Seleciona o driver de armazenamento (recomendado explícito) |
| `BLOB_PREFIX` | `accounts/` | Prefixo dos objetos no Blob *(opcional, padrão: `accounts/`)* |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Janela de rate limiting (15 minutos) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Máximo de requisições por janela |

> **IMPORTANTE**: A variável `PORT` **não deve** ser configurada — o Vercel gerencia isso automaticamente.
>
> **IMPORTANTE**: `DATA_DIR` é usado **apenas** pelo driver `fs` (filesystem local) e **não tem efeito** quando `STORAGE_DRIVER=blob`.
>
> A variável `BLOB_READ_WRITE_TOKEN` é adicionada automaticamente pelo Vercel ao conectar o Blob Store (passo 3). Quando ela estiver presente, o driver `blob` é selecionado automaticamente, a menos que `STORAGE_DRIVER` seja definido explicitamente.

**Para gerar um `ENCRYPTION_KEY` seguro:**
```bash
# No Linux/Mac
openssl rand -base64 32

# Ou com Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Realizar o Deploy

1. Clique em **"Deploy"**
2. Aguarde o build finalizar (normalmente 1-2 minutos)
3. Sua API estará disponível em `https://seu-projeto.vercel.app`

### 6. Verificar o Deploy

Teste o endpoint de health check:

```bash
curl https://seu-projeto.vercel.app/health | jq .
```

Resposta esperada:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "environment": "production",
  "storage": {
    "writable": true
  }
}
```

## Deploy Automático

Por padrão, o Vercel realiza deploy automático a cada push para o branch `main`.

Para desabilitar:
1. Acesse **Settings > Git**
2. Desmarque **"Auto Deployments"**

## Domínio Customizado (Opcional)

1. Acesse **Settings > Domains**
2. Clique em **"Add"**
3. Informe seu domínio (ex: `api.seudominio.com.br`)
4. Siga as instruções de configuração DNS
5. O certificado SSL é provisionado automaticamente

## Monitoramento e Logs

### Visualizar Logs
1. Acesse o painel do projeto no Vercel
2. Clique em **"Functions"**
3. Selecione a função e visualize os logs em tempo real

### Métricas
O Vercel disponibiliza métricas básicas:
- Número de invocações
- Tempo de resposta
- Taxa de erros

Acesse pela aba **"Analytics"** do projeto.

## Segurança

- ✅ HTTPS habilitado automaticamente
- ✅ Certificados SSL gratuitos com renovação automática
- ✅ Variáveis de ambiente criptografadas em repouso
- ✅ Não aparecem nos logs de build

## Configurações por Ambiente

### Preview (Pull Requests)
```
NODE_ENV=production
ALLOWED_ORIGINS=https://staging.seuapp.com
```

### Production
```
NODE_ENV=production
ALLOWED_ORIGINS=https://seuapp.com,https://www.seuapp.com
```

## Checklist de Produção

- [ ] `ENCRYPTION_KEY` forte e aleatória configurada (32+ caracteres)
- [ ] `NODE_ENV` definido como `production`
- [ ] `ALLOWED_ORIGINS` configurado para seus domínios
- [ ] Vercel Blob Storage criado e conectado ao projeto (`BLOB_READ_WRITE_TOKEN` gerado automaticamente)
- [ ] `STORAGE_DRIVER=blob` configurado explicitamente
- [ ] Health check respondendo corretamente (`storage.writable: true`)
- [ ] Todos os endpoints testados com a URL de produção
- [ ] Domínio customizado configurado (se necessário)
- [ ] Documentação compartilhada com a equipe

---

**Pronto para o deploy?** Siga os passos acima e sua API estará no ar em minutos! 🚀
