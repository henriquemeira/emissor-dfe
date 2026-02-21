# Emissor DFe - API REST para Documentos Fiscais Eletrônicos

API middleware para emissão simplificada de documentos fiscais eletrônicos brasileiros (NF-e, NFS-e, CT-e, MDF-e).

> 🤖 **Vibe Coding**: Este projeto está sendo construído com 100% de Inteligência Artificial ✨

## 📋 Características

- ✅ **API REST** com JSON simplificado
- ✅ **Armazenamento seguro** apenas de certificados digitais A1 (criptografados com AES-256-GCM)
- ✅ **Sem banco de dados** - armazenamento em arquivos no sistema de arquivos
- ✅ **Autenticação via API Key** (UUID v4)
- ✅ **Criptografia AES-256-GCM** para certificados e senhas
- ✅ **Rate limiting** configurável
- ✅ **CORS** configurável
- ✅ **Headers de segurança** com Helmet
- ✅ **Validação de certificados** A1 antes de armazenar
- ✅ **Emissão de NF-e** - NF-e v4.00 (emitir, consultar, cancelar, inutilizar)
- 🚧 **Emissão de CT-e, MDF-e** (Fase 4)

## 🚀 Status do Projeto

**Fase 1 (MVP)** - ✅ **COMPLETO**
- Gestão completa de contas (criar, consultar, atualizar, deletar)
- Criptografia e armazenamento seguro de certificados
- Autenticação via API Key
- Validação de certificados A1
- Health check endpoint

**Fase 2** - ✅ **COMPLETO**
- NFS-e (Nota Fiscal de Serviço Eletrônica) - Município de São Paulo/SP
  - ✅ Emissão de RPS em lote (EnvioLoteRpsAsync)
  - ✅ Teste de envio de lote (TesteEnvioLoteRpsAsync)
  - ✅ Suporte ao layout v01-1 (assíncrono)
  - ✅ Assinatura digital de RPS e XML
  - ✅ Validação conforme XSD oficial
  - ✅ Consulta de situação do lote
  - 📅 Cancelamento de NFS-e (planejado)
  - 📅 Consulta de guia (planejado)

**Fase 3** - ✅ **COMPLETO**
- NF-e (Nota Fiscal Eletrônica) versão 4.00
  - ✅ Emissão de NF-e (NFeAutorizacao4)
  - ✅ Consulta de NF-e por chave de acesso (NfeConsultaProtocolo4)
  - ✅ Cancelamento de NF-e via evento (NFeRecepcaoEvento4)
  - ✅ Inutilização de numeração (NfeInutilizacao4)
  - ✅ Assinatura digital XML-DSig automática
  - ✅ Suporte a todos os estados brasileiros

## 🛠️ Tecnologias

### Core
- **Node.js** v18+
- **Express.js** - Framework web
- **dotenv** - Gerenciamento de variáveis de ambiente

### Segurança
- **crypto** (nativo Node.js) - Criptografia AES-256-GCM
- **uuid** - Geração de API Keys
- **helmet** - Headers de segurança HTTP
- **cors** - CORS configurável
- **express-rate-limit** - Rate limiting

### Certificados Digitais
- **node-forge** - Manipulação de certificados PKCS#12 (.pfx/.p12)
- **xml2js** - Manipulação de XML
- **xml-crypto** - Assinatura XML-DSig W3C compliant
- **axios** - Requisições HTTP (SOAP)

### Upload
- **multer** - Upload de arquivos (certificados)

### Desenvolvimento
- **nodemon** - Hot reload em desenvolvimento
- **eslint** - Linting de código

## 📦 Instalação

### Pré-requisitos
- Node.js 18 ou superior
- npm ou yarn

### Passo a passo

1. **Clone o repositório**
```bash
git clone https://github.com/henriquemeira/emissor-dfe.git
cd emissor-dfe
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:
```env
# IMPORTANTE: Altere a ENCRYPTION_KEY para uma string aleatória de 32+ caracteres
ENCRYPTION_KEY=sua-chave-aleatoria-aqui-minimo-32-caracteres

# Porta do servidor
PORT=3000

# Ambiente (development ou production)
NODE_ENV=development

# Origens permitidas para CORS (separadas por vírgula)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Diretório de dados
DATA_DIR=./data

# Rate limiting (15 minutos = 900000ms)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

4. **Inicie o servidor**

**Modo desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🔐 Segurança

### Criptografia
- Certificados A1 são criptografados com **AES-256-GCM** antes de serem salvos em disco
- Senhas dos certificados também são criptografadas com **AES-256-GCM**
- Cada operação de criptografia usa:
  - Salt aleatório de 64 bytes
  - IV (Initialization Vector) aleatório de 16 bytes
  - Auth tag de 16 bytes para integridade
  - Chave derivada da `ENCRYPTION_KEY` usando scrypt

### API Keys
- Geradas usando **UUID v4**
- Únicas para cada conta
- Validadas em todas as requisições autenticadas via header `X-API-Key`

### Rate Limiting
- Por padrão: 100 requisições a cada 15 minutos
- Configurável via variáveis de ambiente
- Aplica-se a todas as rotas `/api/*`

### HTTPS
- **Obrigatório em produção**
- Configure seu reverse proxy (nginx, Apache) ou use plataformas como Vercel ou Render.com que fornecem HTTPS automático

### Headers de Segurança
- Helmet configurado para proteção contra vulnerabilidades comuns
- CORS configurável para permitir apenas origens específicas

### Timestamps e Timezones
- Todos os timestamps são armazenados em **UTC (ISO 8601)**
- A conversão para timezone local deve ser feita no frontend/cliente
- Ver [docs/TIMESTAMP-BEST-PRACTICES.md](docs/TIMESTAMP-BEST-PRACTICES.md) para detalhes

## 📚 API Endpoints

### Health Check

#### GET /health
Verifica o status do servidor (sem autenticação)

**Response 200:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "environment": "development",
  "storage": {
    "writable": true
  }
}
```

### Gestão de Conta

#### POST /api/v1/account/setup
Cria uma nova conta com certificado digital A1

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `certificado` (file): Arquivo .pfx ou .p12
  - `senha` (string): Senha do certificado

**Response 201:**
```json
{
  "success": true,
  "message": "Conta criada com sucesso",
  "data": {
    "apiKey": "550e8400-e29b-41d4-a716-446655440000",
    "certificado": {
      "cnpj": "12.345.678/0001-95",
      "razaoSocial": "Empresa Exemplo LTDA",
      "validade": "2026-12-31T23:59:59.000Z"
    }
  }
}
```

**Erros:**
- `400` - Certificado inválido, expirado ou senha incorreta
- `409` - Já existe conta com este CNPJ

#### GET /api/v1/account/status
Consulta informações da conta e certificado

**Headers:**
- `X-API-Key`: Sua API Key

**Response 200:**
```json
{
  "success": true,
  "message": "Status da conta recuperado com sucesso",
  "data": {
    "certificado": {
      "cnpj": "12.345.678/0001-95",
      "razaoSocial": "Empresa Exemplo LTDA",
      "validade": "2026-12-31T23:59:59.000Z",
      "issuer": "AC VALID RFB"
    },
    "conta": {
      "criadaEm": "2026-02-17T10:00:00.000Z",
      "atualizadaEm": "2026-02-17T10:00:00.000Z"
    }
  }
}
```

**Nota sobre timestamps:** Todos os campos de data/hora (`criadaEm`, `atualizadaEm`, `validade`) estão em formato UTC (ISO 8601). O sufixo `Z` indica UTC. Para exibir em horário local, converta no frontend. Ver [documentação sobre timestamps](docs/TIMESTAMP-BEST-PRACTICES.md).
  }
}
```

**Erros:**
- `401` - API Key inválida ou não fornecida
- `404` - Conta não encontrada

#### PUT /api/v1/account/certificate
Atualiza o certificado digital de uma conta existente

**Headers:**
- `X-API-Key`: Sua API Key

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `certificado` (file): Novo arquivo .pfx ou .p12
  - `senha` (string): Senha do novo certificado

**Response 200:**
```json
{
  "success": true,
  "message": "Certificado atualizado com sucesso",
  "data": {
    "certificado": {
      "cnpj": "12.345.678/0001-95",
      "razaoSocial": "Empresa Exemplo LTDA",
      "validade": "2027-12-31T23:59:59.000Z"
    }
  }
}
```

**Erros:**
- `400` - Certificado inválido ou senha incorreta
- `401` - API Key inválida
- `404` - Conta não encontrada

#### DELETE /api/v1/account
Deleta a conta e todos os dados associados

**Headers:**
- `X-API-Key`: Sua API Key

**Response 200:**
```json
{
  "success": true,
  "message": "Conta deletada com sucesso"
}
```

**Erros:**
- `401` - API Key inválida
- `404` - Conta não encontrada

### Emissão de Documentos Fiscais

#### NFS-e São Paulo/SP

Para documentação completa sobre NFS-e de São Paulo, consulte:
- **[NFSE-SAO-PAULO-API.md](docs/NFSE-SAO-PAULO-API.md)** - Documentação detalhada da API
- **[NFSE-SAO-PAULO-IMPLEMENTATION.md](docs/NFSE-SAO-PAULO-IMPLEMENTATION.md)** - Detalhes da implementação

**Envio de Lote de RPS:**

`POST /api/v1/nfse/sp/sao-paulo/envio-lote-rps`

**Headers:**
- `X-API-Key`: Sua API Key
- `Content-Type`: application/json

**Request Body:**
```json
{
  "layoutVersion": "v01-1",
  "ambiente": "teste",
  "lote": {
    "cabecalho": {
      "cpfCnpjRemetente": { "cnpj": "12345678901234" },
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
}
```

**Response 200:**
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

---

#### Outros Documentos Fiscais

#### NF-e (Nota Fiscal Eletrônica)

Para documentação completa sobre NF-e, consulte:
- **[NFE-API.md](docs/NFE-API.md)** - Documentação detalhada da API NF-e

**Emitir NF-e:**

`POST /api/v1/nfe/emitir`

**Headers:**
- `X-API-Key`: Sua API Key
- `Content-Type`: application/json

**Request Body (resumido):**
```json
{
  "ambiente": "homologacao",
  "nfe": {
    "ide": { "cUF": 35, "mod": 55, "serie": 1, "nNF": 1, "dhEmi": "2024-01-15T10:00:00-03:00", "..." },
    "emit": { "CNPJ": "12345678901234", "xNome": "Emitente Ltda", "IE": "111111111111", "CRT": 3, "..." },
    "dest": { "CNPJ": "98765432109876", "xNome": "Destinatário Ltda", "indIEDest": 1, "..." },
    "det": [{ "nItem": 1, "prod": { "cProd": "001", "xProd": "Produto", "NCM": "84715000", "CFOP": "5102", "..." }, "imposto": { "..." } }],
    "total": { "ICMSTot": { "vProd": 100.00, "vNF": 100.00, "..." } },
    "transp": { "modFrete": 9 },
    "pag": { "detPag": [{ "tPag": "01", "vPag": 100.00 }] }
  }
}
```

**Consultar NF-e:** `POST /api/v1/nfe/consultar`

**Cancelar NF-e:** `POST /api/v1/nfe/cancelar`

**Inutilizar NF-e:** `POST /api/v1/nfe/inutilizar`

---

#### Outros Documentos Fiscais

🚧 **Em desenvolvimento (Fase 4)**

Os seguintes endpoints serão implementados nas próximas fases:
- `POST /api/v1/cte/emitir` - Emitir CT-e
- `POST /api/v1/mdfe/emitir` - Emitir MDF-e

## 🧪 Testando a API

### Usando cURL

**1. Criar conta (setup):**
```bash
curl -X POST http://localhost:3000/api/v1/account/setup \
  -F "certificado=@/caminho/para/certificado.pfx" \
  -F "senha=senhaDoCertificado"
```

**2. Consultar status:**
```bash
curl -X GET http://localhost:3000/api/v1/account/status \
  -H "X-API-Key: sua-api-key-aqui"
```

**3. Atualizar certificado:**
```bash
curl -X PUT http://localhost:3000/api/v1/account/certificate \
  -H "X-API-Key: sua-api-key-aqui" \
  -F "certificado=@/caminho/para/novo-certificado.pfx" \
  -F "senha=novaSenha"
```

**4. Deletar conta:**
```bash
curl -X DELETE http://localhost:3000/api/v1/account \
  -H "X-API-Key: sua-api-key-aqui"
```

### Usando Postman ou Insomnia

Importe a collection fornecida em `docs/postman_collection.json` (será criado em breve).

## 📂 Estrutura do Projeto

```
emissor-dfe/
├── src/
│   ├── server.js                 # Ponto de entrada da aplicação
│   ├── config/
│   │   └── env.js               # Configurações e validação de variáveis de ambiente
│   ├── middleware/
│   │   ├── auth.js              # Autenticação via API Key
│   │   ├── errorHandler.js      # Tratamento global de erros
│   │   └── validateRequest.js   # Validação de requisições
│   ├── services/
│   │   ├── crypto.service.js    # Criptografia AES-256-GCM
│   │   ├── certificate.service.js # Validação e extração de dados de certificados
│   │   ├── storage.service.js   # Operações de leitura/escrita em disco
│   │   ├── nfe.service.js       # Lógica de NF-e (Fase 3)
│   │   ├── nfse.service.js      # Lógica de NFS-e (Fase 2/3)
│   │   │   └── sp/
│   │   │       └── sao-paulo/   # NFS-e São Paulo (Fase 2 - Completo)
│   │   │           ├── nfse-sp.service.js    # Orquestração principal
│   │   │           ├── xml-builder.service.js # Construção de XML
│   │   │           ├── signature.service.js   # Assinatura digital
│   │   │           └── soap-client.service.js # Cliente SOAP
│   │   ├── cte.service.js       # Lógica de CT-e (Fase 4)
│   │   └── mdfe.service.js      # Lógica de MDF-e (Fase 4)
│   ├── routes/
│   │   ├── account.routes.js    # Rotas de gestão de conta
│   │   ├── nfe.routes.js        # Rotas de NF-e (Fase 3)
│   │   ├── nfse.routes.js       # Rotas de NFS-e (Fase 2/3)
│   │   ├── nfse-sp.routes.js    # Rotas de NFS-e São Paulo (Fase 2 - Completo)
│   │   ├── cte.routes.js        # Rotas de CT-e (Fase 4)
│   │   └── mdfe.routes.js       # Rotas de MDF-e (Fase 4)
│   ├── controllers/
│   │   ├── account.controller.js # Controladores de conta
│   │   ├── nfe.controller.js    # Controladores de NF-e (Fase 3)
│   │   ├── nfse.controller.js   # Controladores de NFS-e (Fase 2/3)
│   │   ├── nfse-sp.controller.js # Controladores de NFS-e São Paulo (Fase 2 - Completo)
│   │   ├── cte.controller.js    # Controladores de CT-e (Fase 4)
│   │   └── mdfe.controller.js   # Controladores de MDF-e (Fase 4)
│   └── utils/
│       ├── apiKey.js            # Geração e validação de API Keys
│       └── validators.js        # Validadores personalizados (CNPJ, etc.)
├── data/                        # Certificados criptografados (não versionado)
│   └── .gitkeep
├── docs/                        # Documentação adicional
├── .env.example                 # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Deploy

Escolha a plataforma que melhor se adapta às suas necessidades:

| Recurso | Vercel (Hobby) | Render.com (Free) |
|---------|---------------|-------------------|
| HTTPS automático | ✅ | ✅ |
| Deploy automático (GitHub) | ✅ | ✅ |
| Domínio customizado | ✅ | ✅ |
| Persistência de dados | ✅ 1 GB Blob Storage gratuito | ⚠️ Efêmero (Disk pago para persistir) |
| Sleep em inatividade | ✅ Não dorme (serverless) | ❌ Dorme após 15 min de inatividade |

### Deploy no Vercel

O Vercel é a plataforma **recomendada** para este projeto, pois oferece **1 GB de Blob Storage gratuito** (plano Hobby) — essencial para persistir os certificados digitais criptografados entre deploys.

1. **Crie uma conta no [Vercel](https://vercel.com)** (pode usar login com GitHub)

2. **Importe o projeto**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Conecte seu repositório GitHub
   - O arquivo `vercel.json` já está configurado no repositório

3. **Configure o Vercel Blob Storage**
   - No painel do projeto: **Storage > Create Database > Blob**
   - Nomeie o store (ex: `emissor-dfe-data`) e clique em **Create**
   - A variável `BLOB_READ_WRITE_TOKEN` será adicionada automaticamente

4. **Configure as variáveis de ambiente** em **Settings > Environment Variables**:
   - `ENCRYPTION_KEY` - Sua chave mestra (32+ caracteres aleatórios)
   - `NODE_ENV` - `production`
   - `ALLOWED_ORIGINS` - URLs permitidas (ex: `https://seuapp.com`)
   - `RATE_LIMIT_WINDOW_MS` - `900000`
   - `RATE_LIMIT_MAX_REQUESTS` - `100`
   - > **Não configure `PORT`** — o Vercel gerencia isso automaticamente

5. **Deploy**
   - Clique em **Deploy**
   - HTTPS é fornecido automaticamente
   - Deploy automático a cada push para o branch `main`

Para instruções detalhadas, consulte **[docs/VERCEL-DEPLOYMENT.md](docs/VERCEL-DEPLOYMENT.md)**.

### Deploy no Render.com

O Render.com é uma alternativa simples de configurar. Note que o plano gratuito usa **sistema de arquivos efêmero** — para persistência de dados em produção, utilize um **Disk** pago ou migre os dados para armazenamento externo.

1. **Crie uma conta no [Render.com](https://render.com)**

2. **Crie um novo Web Service**
   - Conecte seu repositório GitHub
   - Configure o serviço:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment:** `Node`

3. **Configure as variáveis de ambiente** no dashboard do Render:
   - `ENCRYPTION_KEY` - Sua chave mestra (32+ caracteres aleatórios)
   - `NODE_ENV` - `production`
   - `ALLOWED_ORIGINS` - URLs permitidas (ex: `https://seuapp.com`)
   - `PORT` - Deixe vazio (Render configura automaticamente)
   - `RATE_LIMIT_WINDOW_MS` - `900000`
   - `RATE_LIMIT_MAX_REQUESTS` - `100`

4. **Deploy**
   - O Render fará deploy automaticamente
   - HTTPS é fornecido automaticamente
   - Suas variáveis de ambiente são seguras

Para instruções detalhadas, consulte **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Health Check
Ambas as plataformas utilizam automaticamente o endpoint `/health` para verificar se o serviço está saudável.

## 🔍 Monitoramento e Logs

### Logs
Em desenvolvimento, os logs são exibidos no console. Em produção, use serviços como:
- **Vercel Logs** (integrado)
- **Render Logs** (integrado)
- **LogDNA**
- **Papertrail**
- **Datadog**

### Métricas
Monitore:
- Taxa de requisições
- Taxa de erros
- Tempo de resposta
- Uso de memória
- Uso de CPU

## ⚠️ Observações Importantes

### Armazenamento
- O sistema **NÃO armazena documentos fiscais** emitidos
- Apenas certificados digitais A1 e suas senhas são armazenados
- Todos os dados são criptografados com AES-256-GCM
- Use backup regular do diretório `data/`

### Certificados
- Apenas certificados A1 (arquivo .pfx ou .p12) são suportados
- Certificados A3 (hardware/cartão) não são suportados
- Valide a data de validade regularmente
- Renove certificados antes do vencimento usando `PUT /api/v1/account/certificate`

### Segurança
- **NUNCA** commit o arquivo `.env` com dados reais
- Use HTTPS obrigatoriamente em produção
- Gere uma `ENCRYPTION_KEY` aleatória e segura
- Mantenha a API Key em local seguro
- Implemente rotação de API Keys se necessário
- Configure CORS para permitir apenas suas origens

### Rate Limiting
- Padrão: 100 requisições por 15 minutos
- Ajuste conforme sua necessidade
- Considere implementar rate limiting por API Key

### CNPJ
- Apenas uma conta por CNPJ é permitida
- O CNPJ é extraído automaticamente do certificado
- Para múltiplos certificados do mesmo CNPJ, delete a conta antiga primeiro

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Roadmap

- [x] **Fase 1 (MVP)** - Gestão de contas e certificados
- [x] **Fase 2** - NFS-e (Nota Fiscal de Serviço Eletrônica)
  - [x] Emissão de RPS do Município de São Paulo / SP
    - [x] EnvioLoteRpsAsync (envio em lote)
    - [x] TesteEnvioLoteRpsAsync (teste/validação)
    - [x] Layout v01-1 (assíncrono)
    - [x] Assinatura digital (RPS + XML-DSig)
    - [x] Documentação completa
    - [x] EnvioRps (envio individual)
  - [x] Consulta de situação do lote
  - [x] Cancelamento de NFS-e
- [x] **Fase 3** - Implementação completa de NF-e
  - [x] Emissão de NF-e (NFeAutorizacao4)
  - [x] Consulta de NF-e por chave de acesso (NfeConsultaProtocolo4)
  - [x] Cancelamento de NF-e via evento (NFeRecepcaoEvento4)
  - [x] Inutilização de numeração (NfeInutilizacao4)
  - [x] Assinatura digital XML-DSig automática
  - [x] Documentação completa com exemplos cURL
- [ ] **Fase 4** - Outros documentos fiscais
  - [ ] CT-e (Conhecimento de Transporte Eletrônico)
  - [ ] MDF-e (Manifesto Eletrônico de Documentos Fiscais)
  - [ ] Emissão de Guia de Recolhimento de impostos de serviços prestados (NFSe)
  - [ ] Consulta de guia de recolhimento de impostos de serviços prestados (NFSe)

- [ ] **Futuro**
  - [ ] Webhooks para notificações
  - [ ] Dashboard web
  - [ ] Suporte a múltiplos certificados por conta
  - [ ] Geração automática de DANFE (PDF)
  - [ ] Cache de consultas SEFAZ
  - [ ] Outros municípios para NFS-e

## 📄 Licença

MIT

---

**Desenvolvido para simplificar a emissão de documentos fiscais eletrônicos no Brasil**
