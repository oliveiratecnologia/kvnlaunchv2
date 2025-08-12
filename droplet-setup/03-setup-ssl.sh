#!/bin/bash
# 03-setup-ssl.sh
# Configuração de SSL/HTTPS com Nginx e Let's Encrypt

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
DROPLET_IP="198.199.81.171"
DOMAIN_NAME="${1:-$DROPLET_IP}"  # Usar domínio passado como parâmetro ou IP
APP_PORT="3000"

log_info "🔒 Configurando SSL/HTTPS para: $DOMAIN_NAME"

# 1. Instalar Nginx
log_info "📦 Instalando Nginx..."
apt update
apt install -y nginx

# Habilitar e iniciar Nginx
systemctl enable nginx
systemctl start nginx

log_success "Nginx instalado e iniciado"

# 2. Configurar Nginx como proxy reverso
log_info "⚙️ Configurando Nginx como proxy reverso..."

# Remover configuração padrão
rm -f /etc/nginx/sites-enabled/default

# Criar configuração para a aplicação
cat > /etc/nginx/sites-available/ebook-generator << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    # Logs
    access_log /var/log/nginx/ebook-generator.access.log;
    error_log /var/log/nginx/ebook-generator.error.log;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:$APP_PORT/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
EOF

# Habilitar site
ln -sf /etc/nginx/sites-available/ebook-generator /etc/nginx/sites-enabled/

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx

log_success "Nginx configurado como proxy reverso"

# 3. Configurar SSL com Let's Encrypt (se domínio for fornecido)
if [[ "$DOMAIN_NAME" != "$DROPLET_IP" ]]; then
    log_info "🔐 Configurando SSL com Let's Encrypt para domínio: $DOMAIN_NAME"
    
    # Instalar Certbot
    apt install -y certbot python3-certbot-nginx
    
    # Obter certificado SSL
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # Configurar renovação automática
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    log_success "SSL configurado com Let's Encrypt"
    log_info "🔄 Renovação automática configurada"
    
else
    log_warning "⚠️ Usando IP em vez de domínio - SSL não configurado"
    log_info "💡 Para SSL, configure um domínio e execute: $0 seu-dominio.com"
fi

# 4. Configurar firewall para Nginx
log_info "🔒 Atualizando firewall para Nginx..."
ufw allow 'Nginx Full'
ufw reload

log_success "Firewall atualizado"

# 5. Otimizar configuração do Nginx
log_info "⚡ Otimizando configuração do Nginx..."
cat >> /etc/nginx/nginx.conf << 'EOF'

# Otimizações adicionais
client_max_body_size 10M;
client_body_timeout 60s;
client_header_timeout 60s;
keepalive_timeout 65s;
send_timeout 60s;

# Worker processes
worker_processes auto;
worker_connections 1024;
EOF

# Recarregar configuração
nginx -t && systemctl reload nginx

log_success "Nginx otimizado"

# 6. Criar script de monitoramento
log_info "📊 Criando script de monitoramento..."
cat > /opt/ebook-generator/monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoramento da aplicação

# Verificar se aplicação está rodando
if ! pm2 list | grep -q "ebook-api.*online"; then
    echo "$(date): Aplicação offline, reiniciando..." >> /var/log/ebook-generator/monitor.log
    pm2 restart ebook-api
fi

# Verificar se Nginx está rodando
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx offline, reiniciando..." >> /var/log/ebook-generator/monitor.log
    systemctl restart nginx
fi

# Verificar conectividade Redis
if ! curl -s http://localhost:3000/health | grep -q "healthy"; then
    echo "$(date): Health check falhou" >> /var/log/ebook-generator/monitor.log
fi
EOF

chmod +x /opt/ebook-generator/monitor.sh

# Adicionar ao crontab para executar a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/ebook-generator/monitor.sh") | crontab -

log_success "Monitoramento configurado"

# 7. Verificar status dos serviços
log_info "🔍 Verificando status dos serviços..."
systemctl status nginx --no-pager
systemctl status certbot.timer --no-pager 2>/dev/null || true

# 8. Mostrar informações finais
log_success "✅ SSL/HTTPS configurado com sucesso!"
echo ""
echo "📊 INFORMAÇÕES DO SERVIDOR:"
echo "  🌐 Endereço: http://$DOMAIN_NAME"
if [[ "$DOMAIN_NAME" != "$DROPLET_IP" ]]; then
    echo "  🔒 HTTPS: https://$DOMAIN_NAME"
fi
echo "  🏥 Health Check: http://$DOMAIN_NAME/health"
echo "  📋 Logs Nginx: /var/log/nginx/"
echo "  📋 Logs App: /var/log/ebook-generator/"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "  • Status Nginx: systemctl status nginx"
echo "  • Reload Nginx: systemctl reload nginx"
echo "  • Logs Nginx: tail -f /var/log/nginx/ebook-generator.access.log"
echo "  • Testar SSL: certbot certificates"
echo ""
log_success "Servidor web configurado e pronto!"
EOF

chmod +x /opt/ebook-generator/03-setup-ssl.sh

log_success "Script SSL criado"

log_success "✅ Deploy da aplicação concluído!"
echo ""
echo "📊 PRÓXIMOS PASSOS:"
echo "  1. Configurar secrets em .env.production:"
echo "     nano $APP_DIR/.env.production"
echo ""
echo "  2. Iniciar aplicação:"
echo "     pm2 start $APP_DIR/api-gateway-droplet.js --name ebook-api"
echo "     pm2 save"
echo ""
echo "  3. Configurar SSL (opcional):"
echo "     bash $APP_DIR/03-setup-ssl.sh [seu-dominio.com]"
echo ""
echo "  4. Testar aplicação:"
echo "     curl http://198.199.81.171:3000/health"
