#!/bin/bash
# 04-start-services.sh
# Inicializar todos os serviços da aplicação

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configurações
APP_DIR="/opt/ebook-generator"
DROPLET_IP="198.199.81.171"

log_info "🚀 Iniciando todos os serviços da aplicação"

# 1. Navegar para diretório da aplicação
cd $APP_DIR

# 2. Verificar se arquivos existem
if [ ! -f "api-gateway-droplet.js" ]; then
    log_error "Arquivo api-gateway-droplet.js não encontrado!"
    log_info "Execute primeiro: bash 02-deploy-application.sh"
    exit 1
fi

if [ ! -f "workers-droplet.js" ]; then
    log_error "Arquivo workers-droplet.js não encontrado!"
    log_info "Execute primeiro: bash 02-deploy-application.sh"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    log_error "Arquivo .env.production não encontrado!"
    log_info "Execute primeiro: bash 02-deploy-application.sh"
    exit 1
fi

# 3. Verificar se secrets estão configurados
log_info "🔍 Verificando configuração de secrets..."

if grep -q "YOUR_OPENAI_API_KEY_HERE" .env.production; then
    log_warning "⚠️ OPENAI_API_KEY não configurado!"
    log_info "Edite: nano .env.production"
fi

if grep -q "YOUR_SERVICE_ROLE_KEY_HERE" .env.production; then
    log_warning "⚠️ SUPABASE_SERVICE_ROLE_KEY não configurado!"
    log_info "Edite: nano .env.production"
fi

# 4. Testar conectividade Redis
log_info "🔗 Testando conectividade Redis..."
if node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'rediss://default:AVNS_lYle9myZMLH1ZazBhlS@ebook-redis-valkey-do-user-24250021-0.m.db.ondigitalocean.com:25061');
redis.ping().then(() => {
  console.log('Redis OK');
  process.exit(0);
}).catch(err => {
  console.error('Redis Error:', err.message);
  process.exit(1);
});
"; then
    log_success "Redis conectado com sucesso"
else
    log_error "Falha na conexão com Redis!"
    log_info "Verifique se o cluster Redis está online"
    exit 1
fi

# 5. Parar serviços existentes (se houver)
log_info "🛑 Parando serviços existentes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# 6. Iniciar API Gateway
log_info "🌐 Iniciando API Gateway..."
pm2 start api-gateway-droplet.js \
    --name "ebook-api" \
    --instances 1 \
    --max-memory-restart 500M \
    --node-args="--max-old-space-size=512" \
    --log-file /var/log/ebook-generator/api.log \
    --error-file /var/log/ebook-generator/api-error.log \
    --out-file /var/log/ebook-generator/api-out.log

sleep 3

# 7. Iniciar Workers
log_info "⚙️ Iniciando Workers BullMQ..."
pm2 start workers-droplet.js \
    --name "ebook-workers" \
    --instances 1 \
    --max-memory-restart 1G \
    --node-args="--max-old-space-size=1024" \
    --log-file /var/log/ebook-generator/workers.log \
    --error-file /var/log/ebook-generator/workers-error.log \
    --out-file /var/log/ebook-generator/workers-out.log

sleep 3

# 8. Salvar configuração PM2
log_info "💾 Salvando configuração PM2..."
pm2 save

# 9. Verificar status dos serviços
log_info "🔍 Verificando status dos serviços..."
pm2 status

# 10. Testar endpoints
log_info "🧪 Testando endpoints..."

# Testar API Gateway
log_info "Testando API Gateway..."
if curl -s -f "http://localhost:3000/health" > /dev/null; then
    log_success "✅ API Gateway respondendo"
else
    log_error "❌ API Gateway não está respondendo"
fi

# Testar Workers
log_info "Testando Workers..."
if curl -s -f "http://localhost:3001/health" > /dev/null; then
    log_success "✅ Workers respondendo"
else
    log_error "❌ Workers não estão respondendo"
fi

# 11. Testar endpoint público
log_info "🌐 Testando endpoint público..."
if curl -s -f "http://$DROPLET_IP:3000/api/test" > /dev/null; then
    log_success "✅ Endpoint público acessível"
else
    log_warning "⚠️ Endpoint público pode não estar acessível"
    log_info "Verifique firewall: ufw status"
fi

# 12. Mostrar informações finais
log_success "🎉 Todos os serviços iniciados com sucesso!"
echo ""
echo "📊 STATUS DOS SERVIÇOS:"
pm2 status

echo ""
echo "🌐 ENDPOINTS DISPONÍVEIS:"
echo "  • API Test: http://$DROPLET_IP:3000/api/test"
echo "  • Health Check API: http://$DROPLET_IP:3000/health"
echo "  • Health Check Workers: http://$DROPLET_IP:3001/health"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "  • Status: pm2 status"
echo "  • Logs API: pm2 logs ebook-api"
echo "  • Logs Workers: pm2 logs ebook-workers"
echo "  • Restart API: pm2 restart ebook-api"
echo "  • Restart Workers: pm2 restart ebook-workers"
echo "  • Monitoramento: pm2 monit"
echo ""
echo "📋 LOGS:"
echo "  • API: /var/log/ebook-generator/api.log"
echo "  • Workers: /var/log/ebook-generator/workers.log"
echo "  • Nginx: /var/log/nginx/ebook-generator.access.log"
echo ""

# 13. Testar criação de job (se secrets estiverem configurados)
if ! grep -q "YOUR_OPENAI_API_KEY_HERE" .env.production && ! grep -q "YOUR_SERVICE_ROLE_KEY_HERE" .env.production; then
    log_info "🧪 Testando criação de job de ebook..."
    
    RESPONSE=$(curl -s -X POST "http://localhost:3000/api/ebooks/generate" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: ebook-api-secret-2025-digitalocean" \
        -d '{
            "userId": "test-user-droplet",
            "ebookData": {
                "titulo": "Teste DigitalOcean Droplet",
                "categoria": "Tecnologia",
                "numeroCapitulos": 3
            }
        }' || echo "ERROR")
    
    if echo "$RESPONSE" | grep -q "success"; then
        log_success "✅ Job de teste criado com sucesso!"
        echo "Response: $RESPONSE"
    else
        log_warning "⚠️ Falha ao criar job de teste"
        echo "Response: $RESPONSE"
    fi
else
    log_warning "⚠️ Secrets não configurados - pule o teste de job"
    log_info "Configure os secrets em .env.production e reinicie os serviços"
fi

echo ""
log_success "🚀 Sistema de geração de ebooks está rodando no Droplet!"
log_info "💡 Para configurar SSL/domínio, execute: bash 03-setup-ssl.sh [seu-dominio.com]"
