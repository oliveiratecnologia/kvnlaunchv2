#!/bin/bash
# 01-initial-setup.sh
# Setup inicial do DigitalOcean Droplet para sistema de geração de ebooks

set -e

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

# Informações do servidor
DROPLET_IP="198.199.81.171"
DROPLET_NAME="ebook-generator-server"

log_info "🚀 Iniciando setup do Droplet: $DROPLET_NAME"
log_info "📍 IP Público: $DROPLET_IP"

# 1. Atualizar sistema
log_info "📦 Atualizando sistema Ubuntu 24.04..."
apt update && apt upgrade -y

# 2. Instalar dependências básicas
log_info "🔧 Instalando dependências básicas..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    nano \
    vim

# 3. Configurar firewall básico
log_info "🔒 Configurando firewall UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Permitir SSH
ufw allow 22/tcp comment 'SSH'

# Permitir HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Permitir porta da aplicação
ufw allow 3000/tcp comment 'Node.js App'

# Habilitar firewall
ufw --force enable

log_success "Firewall configurado com sucesso"

# 4. Configurar fail2ban para SSH
log_info "🛡️ Configurando fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

systemctl enable fail2ban
systemctl restart fail2ban

log_success "fail2ban configurado com sucesso"

# 5. Instalar Node.js 18 LTS
log_info "📦 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalação
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

log_success "Node.js instalado: $NODE_VERSION"
log_success "npm instalado: $NPM_VERSION"

# 6. Instalar PM2 globalmente
log_info "🔄 Instalando PM2..."
npm install -g pm2

# Configurar PM2 para iniciar com o sistema
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

log_success "PM2 instalado e configurado"

# 7. Instalar dependências do Puppeteer/Chromium
log_info "🌐 Instalando dependências do Chromium para Puppeteer..."
apt install -y \
    chromium-browser \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xvfb

log_success "Dependências do Chromium instaladas"

# 8. Criar usuário para aplicação (opcional, por segurança)
log_info "👤 Criando usuário para aplicação..."
if ! id "ebook" &>/dev/null; then
    useradd -m -s /bin/bash ebook
    usermod -aG sudo ebook
    log_success "Usuário 'ebook' criado"
else
    log_warning "Usuário 'ebook' já existe"
fi

# 9. Criar diretórios da aplicação
log_info "📁 Criando estrutura de diretórios..."
mkdir -p /opt/ebook-generator
mkdir -p /opt/ebook-generator/logs
mkdir -p /opt/ebook-generator/temp
mkdir -p /var/log/ebook-generator

# Definir permissões
chown -R ebook:ebook /opt/ebook-generator
chown -R ebook:ebook /var/log/ebook-generator

log_success "Estrutura de diretórios criada"

# 10. Configurar swap (importante para aplicações Node.js)
log_info "💾 Configurando swap de 2GB..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Adicionar ao fstab para persistir após reboot
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    log_success "Swap de 2GB configurado"
else
    log_warning "Swap já configurado"
fi

# 11. Otimizar configurações do sistema para Node.js
log_info "⚡ Otimizando configurações do sistema..."
cat >> /etc/sysctl.conf << 'EOF'

# Otimizações para Node.js
fs.file-max = 65536
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
vm.swappiness = 10
EOF

sysctl -p

log_success "Configurações do sistema otimizadas"

# 12. Instalar e configurar logrotate
log_info "📋 Configurando logrotate..."
cat > /etc/logrotate.d/ebook-generator << 'EOF'
/var/log/ebook-generator/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 ebook ebook
    postrotate
        pm2 reload all
    endscript
}
EOF

log_success "Logrotate configurado"

# 13. Verificar status dos serviços
log_info "🔍 Verificando status dos serviços..."
systemctl status ufw --no-pager
systemctl status fail2ban --no-pager
systemctl status pm2-root --no-pager

# 14. Mostrar informações finais
log_success "✅ Setup inicial concluído com sucesso!"
echo ""
echo "📊 INFORMAÇÕES DO SERVIDOR:"
echo "  🖥️  Hostname: $(hostname)"
echo "  🌐 IP Público: $DROPLET_IP"
echo "  💾 Memória: $(free -h | grep Mem | awk '{print $2}')"
echo "  💿 Disco: $(df -h / | tail -1 | awk '{print $2}')"
echo "  🔄 Node.js: $NODE_VERSION"
echo "  📦 npm: $NPM_VERSION"
echo "  🔧 PM2: $(pm2 --version)"
echo ""
echo "🔥 PRÓXIMOS PASSOS:"
echo "  1. Executar: 02-deploy-application.sh"
echo "  2. Configurar SSL com: 03-setup-ssl.sh"
echo "  3. Testar aplicação"
echo ""
log_success "Servidor pronto para deploy da aplicação!"
