#!/bin/bash
# scripts/deploy-commands.sh
# Comandos para deploy no DigitalOcean App Platform

set -e

echo "🚀 Deploy DigitalOcean App Platform - Sistema de Geração de Ebooks"
echo "=================================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
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

# Verificar se doctl está instalado
if ! command -v doctl &> /dev/null; then
    log_error "doctl não está instalado!"
    echo ""
    echo "Instale o doctl:"
    echo "  macOS: brew install doctl"
    echo "  Linux: wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz"
    echo "  Windows: choco install doctl"
    echo ""
    echo "Ou baixe de: https://github.com/digitalocean/doctl/releases"
    exit 1
fi

log_success "doctl encontrado: $(doctl version)"

# Verificar autenticação
log_info "Verificando autenticação DigitalOcean..."
if ! doctl account get &> /dev/null; then
    log_error "Não autenticado no DigitalOcean!"
    echo ""
    echo "Execute: doctl auth init"
    echo "Ou obtenha um token em: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

log_success "Autenticado como: $(doctl account get --format Email --no-header)"

# Verificar se app.yaml existe
if [ ! -f "app.yaml" ]; then
    log_error "Arquivo app.yaml não encontrado!"
    echo "Certifique-se de estar no diretório correto do projeto."
    exit 1
fi

log_success "app.yaml encontrado"

# Validar app.yaml
log_info "Validando app.yaml..."
if doctl apps spec validate app.yaml; then
    log_success "app.yaml é válido"
else
    log_error "app.yaml inválido! Corrija os erros antes de continuar."
    exit 1
fi

# Verificar se já existe uma app com o mesmo nome
APP_NAME="ebook-generator-system"
EXISTING_APP=$(doctl apps list --format Name --no-header | grep "^${APP_NAME}$" || true)

if [ -n "$EXISTING_APP" ]; then
    log_warning "App '${APP_NAME}' já existe!"
    echo ""
    read -p "Deseja atualizar a app existente? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        APP_ID=$(doctl apps list --format ID,Name --no-header | grep "${APP_NAME}" | awk '{print $1}')
        log_info "Atualizando app existente (ID: ${APP_ID})..."
        doctl apps update "${APP_ID}" --spec app.yaml
        log_success "App atualizada com sucesso!"
    else
        log_info "Deploy cancelado pelo usuário."
        exit 0
    fi
else
    # Criar nova app
    log_info "Criando nova app: ${APP_NAME}..."
    doctl apps create --spec app.yaml
    log_success "App criada com sucesso!"
fi

# Obter ID da app
APP_ID=$(doctl apps list --format ID,Name --no-header | grep "${APP_NAME}" | awk '{print $1}')

if [ -z "$APP_ID" ]; then
    log_error "Não foi possível obter o ID da app!"
    exit 1
fi

log_success "App ID: ${APP_ID}"

# Monitorar deploy
log_info "Monitorando deploy..."
echo ""
echo "Comandos úteis:"
echo "  Status da app: doctl apps get ${APP_ID}"
echo "  Logs: doctl apps logs ${APP_ID} --follow"
echo "  Deployments: doctl apps list-deployments ${APP_ID}"
echo ""

# Aguardar deploy inicial
log_info "Aguardando deploy inicial (pode levar alguns minutos)..."
sleep 10

# Verificar status
STATUS=$(doctl apps get "${APP_ID}" --format Status --no-header)
log_info "Status atual: ${STATUS}"

if [ "$STATUS" = "ACTIVE" ]; then
    log_success "Deploy concluído com sucesso!"
    
    # Obter URL da app
    APP_URL=$(doctl apps get "${APP_ID}" --format URL --no-header)
    log_success "App URL: ${APP_URL}"
    
    # Testar health check
    log_info "Testando health check..."
    if curl -s "${APP_URL}/health" > /dev/null; then
        log_success "Health check OK!"
    else
        log_warning "Health check falhou - app pode ainda estar inicializando"
    fi
    
else
    log_warning "Deploy ainda em progresso. Status: ${STATUS}"
    echo ""
    echo "Continue monitorando com:"
    echo "  doctl apps get ${APP_ID}"
    echo "  doctl apps logs ${APP_ID} --follow"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Configurar secrets (Supabase, OpenAI, API keys)"
echo "2. Testar endpoints da API"
echo "3. Validar fluxo completo de geração de ebooks"
echo ""
echo "📋 COMANDOS ÚTEIS:"
echo "  Status: doctl apps get ${APP_ID}"
echo "  Logs: doctl apps logs ${APP_ID} --follow"
echo "  URL: doctl apps get ${APP_ID} --format URL --no-header"
echo ""

log_success "Deploy script concluído!"
