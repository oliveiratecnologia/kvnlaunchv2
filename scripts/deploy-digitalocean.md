# 🚀 Deploy DigitalOcean App Platform - Sistema de Geração de Ebooks

## ✅ Pré-requisitos Confirmados
- ✅ Redis Valkey ONLINE: `66e56096-f031-42ed-9797-ff5feb9a9ffe`
- ✅ Código adaptado para DigitalOcean
- ✅ app.yaml configurado
- ✅ Variáveis de ambiente documentadas

---

## 📋 PASSO 1: Instalar e Configurar doctl CLI

### macOS
```bash
# Instalar via Homebrew
brew install doctl

# Ou baixar diretamente
curl -OL https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-darwin-amd64.tar.gz
tar xf doctl-1.104.0-darwin-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

### Linux
```bash
# Ubuntu/Debian
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Verificar instalação
doctl version
```

### Windows
```powershell
# Via Chocolatey
choco install doctl

# Ou baixar .exe de: https://github.com/digitalocean/doctl/releases
```

---

## 🔑 PASSO 2: Autenticar doctl

```bash
# Iniciar autenticação (abrirá browser)
doctl auth init

# Ou usar token diretamente
doctl auth init --access-token YOUR_DO_TOKEN

# Verificar autenticação
doctl account get
```

**Obter Token DigitalOcean:**
1. Acesse: https://cloud.digitalocean.com/account/api/tokens
2. Clique "Generate New Token"
3. Nome: "doctl-ebook-deploy"
4. Escopo: Read + Write
5. Copie o token gerado

---

## 🚀 PASSO 3: Deploy da Aplicação

### 3.1 Verificar app.yaml
```bash
# Validar sintaxe do app.yaml
doctl apps spec validate app.yaml
```

### 3.2 Criar aplicação
```bash
# Deploy inicial
doctl apps create --spec app.yaml

# Exemplo de resposta esperada:
# Notice: App created
# ID: abc123-def456-ghi789
# Name: ebook-generator-system
# Status: pending_deploy
```

### 3.3 Monitorar deploy
```bash
# Obter ID da app (substitua APP_ID)
doctl apps list

# Verificar status do deploy
doctl apps get APP_ID

# Acompanhar logs em tempo real
doctl apps logs APP_ID --follow
```

---

## 🔐 PASSO 4: Configurar Secrets/Variáveis

### 4.1 Preparar arquivo de secrets
```bash
# Criar arquivo temporário com secrets
cat > secrets.env << 'EOF'
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
API_SECRET_KEY=your-super-secret-api-key
EOF
```

### 4.2 Atualizar app.yaml com secrets
```bash
# Criar versão atualizada do app.yaml com secrets
cat > app-with-secrets.yaml << 'EOF'
# Copiar conteúdo do app.yaml original e adicionar:
envs:
  - key: NODE_ENV
    value: production
  - key: REDIS_URL
    value: rediss://default:AVNS_lYle9myZMLH1ZazBhlS@ebook-redis-valkey-do-user-24250021-0.m.db.ondigitalocean.com:25061
  - key: SUPABASE_URL
    value: https://your-project.supabase.co
    scope: RUN_TIME
    type: SECRET
  - key: SUPABASE_ANON_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    scope: RUN_TIME
    type: SECRET
  - key: SUPABASE_SERVICE_ROLE_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    scope: RUN_TIME
    type: SECRET
  - key: OPENAI_API_KEY
    value: sk-proj-...
    scope: RUN_TIME
    type: SECRET
  - key: API_SECRET_KEY
    value: your-super-secret-api-key
    scope: RUN_TIME
    type: SECRET
EOF
```

### 4.3 Atualizar aplicação com secrets
```bash
# Atualizar app com secrets
doctl apps update APP_ID --spec app-with-secrets.yaml

# Verificar se secrets foram aplicados
doctl apps get APP_ID
```

---

## 🔍 PASSO 5: Verificação do Deploy

### 5.1 Verificar status dos serviços
```bash
# Status geral da app
doctl apps get APP_ID

# Logs específicos por serviço
doctl apps logs APP_ID --type=deploy
doctl apps logs APP_ID --type=run

# Verificar deployments
doctl apps list-deployments APP_ID
```

### 5.2 Testar endpoints
```bash
# Obter URL da aplicação
APP_URL=$(doctl apps get APP_ID --format URL --no-header)
echo "App URL: $APP_URL"

# Testar health check
curl "$APP_URL/health"

# Resposta esperada:
# {
#   "status": "healthy",
#   "service": "digitalocean-api-gateway",
#   "redis": { "connected": true },
#   "queues": { ... }
# }
```

### 5.3 Testar API completa
```bash
# Testar endpoint de teste
curl "$APP_URL/api/test"

# Testar criação de ebook (com API key)
curl -X POST "$APP_URL/api/ebooks/generate" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-super-secret-api-key" \
  -d '{
    "userId": "test-user",
    "ebookData": {
      "titulo": "Teste DigitalOcean",
      "categoria": "Tecnologia",
      "numeroCapitulos": 3
    }
  }'
```

---

## 🎯 COMANDOS RESUMIDOS

```bash
# 1. Instalar doctl
brew install doctl  # macOS

# 2. Autenticar
doctl auth init

# 3. Deploy
doctl apps create --spec app.yaml

# 4. Obter ID da app
APP_ID=$(doctl apps list --format ID --no-header | head -1)

# 5. Monitorar
doctl apps get $APP_ID
doctl apps logs $APP_ID --follow

# 6. Testar
APP_URL=$(doctl apps get $APP_ID --format URL --no-header)
curl "$APP_URL/health"
```

---

## ⚠️ Troubleshooting

### Deploy falha
```bash
# Verificar logs de erro
doctl apps logs APP_ID --type=build

# Verificar spec
doctl apps spec validate app.yaml
```

### Conectividade Redis
```bash
# Testar Redis separadamente
node scripts/test-redis-connection.js
```

### Secrets não funcionam
```bash
# Verificar se secrets estão configurados
doctl apps get APP_ID --format Spec

# Recriar secrets
doctl apps update APP_ID --spec app-with-secrets.yaml
```

---

## 📊 Métricas de Sucesso

- ✅ App status: `ACTIVE`
- ✅ Health check: `200 OK`
- ✅ Redis conectado: `true`
- ✅ Workers rodando: `3 serviços`
- ✅ API respondendo: `/api/test`

**Próximo passo**: Executar comandos acima para fazer o deploy!
