# 🚀 GUIA DE DEPLOY - DigitalOcean App Platform

## ✅ Status Atual
- ✅ **Redis Valkey**: ONLINE (ID: 66e56096-f031-42ed-9797-ff5feb9a9ffe)
- ✅ **Código**: Adaptado para DigitalOcean
- ✅ **app.yaml**: Configurado com secrets
- ✅ **Scripts**: Prontos para deploy

---

## 🎯 EXECUTE ESTES COMANDOS EM SEQUÊNCIA

### 1️⃣ Instalar doctl (se não tiver)

**macOS:**
```bash
brew install doctl
```

**Linux:**
```bash
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

**Windows:**
```powershell
choco install doctl
```

### 2️⃣ Autenticar no DigitalOcean

```bash
# Iniciar autenticação (abrirá browser)
doctl auth init

# Verificar se funcionou
doctl account get
```

**Token DigitalOcean:**
- Acesse: https://cloud.digitalocean.com/account/api/tokens
- Clique "Generate New Token"
- Nome: "ebook-deploy"
- Escopo: Read + Write

### 3️⃣ Validar configuração

```bash
# Verificar se app.yaml é válido
doctl apps spec validate app.yaml
```

### 4️⃣ Fazer o deploy

```bash
# Criar a aplicação
doctl apps create --spec app.yaml

# Obter ID da app criada
APP_ID=$(doctl apps list --format ID --no-header | head -1)
echo "App ID: $APP_ID"
```

### 5️⃣ Monitorar o deploy

```bash
# Verificar status
doctl apps get $APP_ID

# Acompanhar logs em tempo real
doctl apps logs $APP_ID --follow

# Verificar deployments
doctl apps list-deployments $APP_ID
```

### 6️⃣ Testar a aplicação

```bash
# Obter URL da app
APP_URL=$(doctl apps get $APP_ID --format URL --no-header)
echo "App URL: $APP_URL"

# Testar health check
curl "$APP_URL/health"

# Testar API
curl "$APP_URL/api/test"
```

---

## 🔐 CONFIGURAÇÃO DE SECRETS

Os secrets já estão no app.yaml, mas você pode atualizá-los:

### Supabase (já configurado)
- `SUPABASE_URL`: https://ieyreghtisdwsscfjbik.supabase.co
- `SUPABASE_ANON_KEY`: Configurado
- `SUPABASE_SERVICE_ROLE_KEY`: Precisa ser atualizado

### OpenAI
- `OPENAI_API_KEY`: Precisa ser configurado com sua chave real

### API Security
- `API_SECRET_KEY`: ebook-api-secret-2025-digitalocean

---

## 📊 VERIFICAÇÕES DE SUCESSO

### ✅ Deploy bem-sucedido:
```bash
# Status deve ser "ACTIVE"
doctl apps get $APP_ID --format Status --no-header
```

### ✅ Health check funcionando:
```bash
curl "$APP_URL/health"
# Resposta esperada:
# {
#   "status": "healthy",
#   "service": "digitalocean-api-gateway",
#   "redis": { "connected": true }
# }
```

### ✅ Workers rodando:
```bash
# Logs devem mostrar workers conectados
doctl apps logs $APP_ID --type=run | grep -i worker
```

---

## 🚨 TROUBLESHOOTING

### Deploy falha:
```bash
# Ver logs de build
doctl apps logs $APP_ID --type=build

# Ver logs de runtime
doctl apps logs $APP_ID --type=run
```

### Redis não conecta:
```bash
# Verificar status do Redis
# (usar MCP tool db-cluster-get_digitalocean)
```

### Secrets não funcionam:
```bash
# Atualizar app com secrets corrigidos
doctl apps update $APP_ID --spec app.yaml
```

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Testar fluxo completo**:
   ```bash
   curl -X POST "$APP_URL/api/ebooks/generate" \
     -H "Content-Type: application/json" \
     -H "X-API-Key: ebook-api-secret-2025-digitalocean" \
     -d '{
       "userId": "test-user",
       "ebookData": {
         "titulo": "Teste DigitalOcean",
         "categoria": "Tecnologia",
         "numeroCapitulos": 3
       }
     }'
   ```

2. **Atualizar Vercel** para usar nova URL
3. **Migrar dados Redis** se necessário
4. **Desativar Railway** após confirmação

---

## 💰 **CUSTOS FINAIS - CONFIGURAÇÃO OTIMIZADA**

### **Custos DigitalOcean (Configuração Atual):**
| Serviço | Configuração | Custo/mês |
|---------|--------------|-----------|
| API Gateway | basic-xxs (1 instância) | $5 |
| Workers | basic-xxs (1 instância) | $5 |
| Redis Valkey | 1GB RAM | $15 |
| **TOTAL** | | **$25/mês** |

### **Comparação com Railway:**
- **Railway**: ~$50/mês (instável)
- **DigitalOcean**: $25/mês (estável)
- **💸 Economia**: $25/mês (50% redução)

### **⚠️ Limitação Importante:**
- `basic-xxs` permite apenas 1 instância por serviço
- Configuração otimizada para máxima economia
- Escalável para `basic-xs` se necessário (2+ instâncias)

---

## 📋 COMANDOS RESUMIDOS

```bash
# Deploy completo em uma sequência
doctl auth init
doctl apps spec validate app.yaml
doctl apps create --spec app.yaml
APP_ID=$(doctl apps list --format ID --no-header | head -1)
doctl apps get $APP_ID
APP_URL=$(doctl apps get $APP_ID --format URL --no-header)
curl "$APP_URL/health"
```

**Execute estes comandos para fazer o deploy agora!** 🚀
