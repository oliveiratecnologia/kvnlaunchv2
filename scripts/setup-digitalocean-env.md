# Configuração de Variáveis de Ambiente - DigitalOcean App Platform

## 📋 Checklist de Variáveis Obrigatórias

### ✅ Já Configuradas
- `NODE_ENV=production`
- `REDIS_URL=rediss://default:AVNS_lYle9myZMLH1ZazBhlS@ebook-redis-valkey-do-user-24250021-0.m.db.ondigitalocean.com:25061`
- `PORT=3000`

### 🔐 Secrets a Configurar no App Platform

#### 1. Supabase
```bash
# No painel do DigitalOcean App Platform, adicionar como secrets:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. OpenAI API
```bash
OPENAI_API_KEY=sk-proj-...
```

#### 3. API Security
```bash
# Gerar uma chave secreta forte para autenticação da API
API_SECRET_KEY=your-super-secret-api-key-here
```

## 🚀 Passos para Configurar no DigitalOcean

### 1. Via Interface Web
1. Acesse o painel do DigitalOcean
2. Vá para Apps → Sua App → Settings → Environment Variables
3. Adicione cada variável como "Encrypted" para secrets sensíveis

### 2. Via CLI (doctl)
```bash
# Instalar doctl se necessário
# brew install doctl (macOS)
# ou baixar de: https://github.com/digitalocean/doctl

# Autenticar
doctl auth init

# Configurar variáveis (substitua APP_ID pelo ID da sua app)
doctl apps update APP_ID --spec app.yaml
```

### 3. Via API
```bash
# Exemplo usando curl para atualizar env vars
curl -X PUT \
  -H "Authorization: Bearer YOUR_DO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "spec": {
      "envs": [
        {
          "key": "SUPABASE_URL",
          "value": "https://your-project.supabase.co",
          "scope": "RUN_TIME",
          "type": "SECRET"
        }
      ]
    }
  }' \
  "https://api.digitalocean.com/v2/apps/YOUR_APP_ID"
```

## 🔍 Verificação das Variáveis

### Health Check Endpoint
Após configurar, teste o endpoint:
```bash
curl https://your-app.ondigitalocean.app/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-12T20:30:00.000Z",
  "service": "digitalocean-api-gateway",
  "redis": { "connected": true },
  "queues": {
    "content-generation": { "waiting": 0 },
    "pdf-generation": { "waiting": 0 },
    "file-upload": { "waiting": 0 }
  }
}
```

## 🛡️ Segurança

### Variáveis Sensíveis (usar como SECRET)
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `API_SECRET_KEY`

### Variáveis Públicas (usar como GENERAL)
- `NODE_ENV`
- `PORT`
- `SUPABASE_URL` (pode ser público)

## 🔄 Atualização de Variáveis

Para atualizar variáveis após o deploy:
1. Modifique no painel DigitalOcean
2. A app será automaticamente re-deployada
3. Verifique o health check após o redeploy

## 📝 Notas Importantes

- Redis URL já está configurada no app.yaml
- Secrets são criptografados pelo DigitalOcean
- Mudanças em env vars triggam novo deploy
- Use o health check para validar configurações
