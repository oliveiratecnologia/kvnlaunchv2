#!/bin/bash
# 02-deploy-application.sh
# Deploy da aplicação de geração de ebooks no Droplet

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
REPO_URL="https://github.com/oliveiratecnologia/criador-de-produto-main.git"
BRANCH="main"

log_info "🚀 Iniciando deploy da aplicação de geração de ebooks"

# 1. Navegar para diretório da aplicação
cd $APP_DIR

# 2. Clonar ou atualizar repositório
if [ -d ".git" ]; then
    log_info "📥 Atualizando repositório existente..."
    git pull origin $BRANCH
else
    log_info "📥 Clonando repositório..."
    git clone $REPO_URL .
    git checkout $BRANCH
fi

log_success "Código fonte atualizado"

# 3. Instalar dependências
log_info "📦 Instalando dependências npm..."
npm install --production

log_success "Dependências instaladas"

# 4. Criar arquivo de configuração de ambiente
log_info "⚙️ Configurando variáveis de ambiente..."
cat > .env.production << 'EOF'
# Ambiente
NODE_ENV=production
PORT=3000

# Redis DigitalOcean Valkey
REDIS_URL=rediss://default:AVNS_lYle9myZMLH1ZazBhlS@ebook-redis-valkey-do-user-24250021-0.m.db.ondigitalocean.com:25061

# Supabase
SUPABASE_URL=https://ieyreghtisdwsscfjbik.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlleXJlZ2h0aXNkd3NzY2ZqYmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5NzI5NzQsImV4cCI6MjAzODU0ODk3NH0.Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6Ej6
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# API Security
API_SECRET_KEY=ebook-api-secret-2025-digitalocean

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# BullMQ
BULLMQ_CONCURRENCY_CONTENT=2
BULLMQ_CONCURRENCY_PDF=3
BULLMQ_CONCURRENCY_UPLOAD=4

# Logs
LOG_LEVEL=info
LOG_DIR=/var/log/ebook-generator
EOF

log_success "Arquivo .env.production criado"

# 5. Criar versões adaptadas dos arquivos para Droplet
log_info "🔧 Criando arquivos adaptados para Droplet..."

# API Gateway para Droplet
cat > api-gateway-droplet.js << 'EOF'
#!/usr/bin/env node
// api-gateway-droplet.js
// API Gateway para DigitalOcean Droplet

require('dotenv').config({ path: '.env.production' });

const express = require('express');
const cors = require('cors');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 Iniciando API Gateway DigitalOcean Droplet...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);

// Configuração Redis DigitalOcean Valkey
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  connectTimeout: 10000,
  commandTimeout: 8000,
  lazyConnect: false,
  enableOfflineQueue: true,
});

// Configuração das filas BullMQ
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 3,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Criar filas
const contentQueue = new Queue('content-generation', queueConfig);
const pdfQueue = new Queue('pdf-generation', queueConfig);
const uploadQueue = new Queue('file-upload', queueConfig);

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS configurado
app.use(cors({
  origin: [
    'https://criador-de-produto-main.vercel.app',
    'https://closify.com',
    /https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Logs coloridos
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Middleware de autenticação
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;
  
  if (!expectedKey || apiKey !== expectedKey) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'API key inválida ou ausente' 
    });
  }
  
  next();
};

// Health check endpoint (público)
app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    
    const [contentWaiting, pdfWaiting, uploadWaiting] = await Promise.all([
      contentQueue.getWaiting(),
      pdfQueue.getWaiting(),
      uploadQueue.getWaiting(),
    ]);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'digitalocean-droplet-api',
      server: {
        hostname: require('os').hostname(),
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      redis: { connected: true },
      queues: {
        'content-generation': { waiting: contentWaiting.length },
        'pdf-generation': { waiting: pdfWaiting.length },
        'file-upload': { waiting: uploadWaiting.length },
      }
    };
    
    res.json(healthStatus);
    log(`Health check: OK`, colors.green);
        
  } catch (error) {
    log(`Erro no health check: ${error.message}`, colors.red);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para criar ebook (protegido)
app.post('/api/ebooks/generate', authenticateAPI, async (req, res) => {
  try {
    const { userId, ebookData } = req.body;
    
    if (!userId || !ebookData) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'userId e ebookData são obrigatórios'
      });
    }
    
    if (!ebookData.titulo || !ebookData.categoria) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'ebookData deve conter titulo e categoria'
      });
    }
    
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const jobData = {
      userId,
      ebookData: {
        titulo: ebookData.titulo,
        categoria: ebookData.categoria,
        numeroCapitulos: ebookData.numeroCapitulos || 5,
        detalhesAdicionais: ebookData.detalhesAdicionais
      },
      requestId,
      timestamp: Date.now()
    };
    
    const job = await contentQueue.add('generate-ebook-content', jobData, {
      jobId: `ebook-${requestId}`,
    });
    
    log(`Novo job criado: ${job.id} para usuário ${userId}`, colors.green);
    
    res.status(202).json({
      success: true,
      message: 'Ebook adicionado à fila de processamento',
      data: {
        jobId: job.id,
        requestId,
        status: 'queued',
        estimatedTime: '2-5 minutos'
      }
    });
    
  } catch (error) {
    log(`Erro ao criar job: ${error.message}`, colors.red);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint de teste (público)
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'DigitalOcean Droplet API funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: require('os').hostname()
  });
});

// Middleware de erro global
app.use((error, req, res, next) => {
  log(`Erro não tratado: ${error.message}`, colors.red);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint não encontrado'
  });
});

// Iniciar servidor
async function startServer() {
  try {
    log('Verificando conexão com DigitalOcean Redis...', colors.blue);
    await redis.ping();
    log('Redis conectado com sucesso', colors.green);
    
    app.listen(port, '0.0.0.0', () => {
      log(`🚀 API Gateway DigitalOcean rodando na porta ${port}`, colors.green);
      log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
      log(`🔗 Health check: http://198.199.81.171:${port}/health`, colors.blue);
    });
    
  } catch (error) {
    log(`Erro fatal ao iniciar servidor: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('🛑 Recebido SIGTERM, encerrando servidor...', colors.yellow);
  process.exit(0);
});

process.on('SIGINT', () => {
  log('🛑 Recebido SIGINT, encerrando servidor...', colors.yellow);
  process.exit(0);
});

startServer().catch((error) => {
  log(`Erro fatal: ${error.message}`, colors.red);
  process.exit(1);
});
EOF

log_success "API Gateway criado"

# Workers BullMQ para Droplet
cat > workers-droplet.js << 'EOF'
#!/usr/bin/env node
// workers-droplet.js
// Workers BullMQ para DigitalOcean Droplet

require('dotenv').config({ path: '.env.production' });

const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const express = require('express');

console.log('🚀 Iniciando Workers BullMQ DigitalOcean Droplet...');

// Configuração Redis
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  connectTimeout: 10000,
  commandTimeout: 8000,
  lazyConnect: false,
  enableOfflineQueue: true,
});

// Configuração das filas
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 3,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Criar filas
const contentQueue = new Queue('content-generation', queueConfig);
const pdfQueue = new Queue('pdf-generation', queueConfig);
const uploadQueue = new Queue('file-upload', queueConfig);

// Logs coloridos
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Processadores de jobs (simulados para teste)
async function processContentJob(job) {
  log(`Processando job de conteúdo: ${job.id}`, colors.blue);

  const { ebookData, userId, requestId } = job.data;

  // Simular processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  const estrutura = {
    titulo: ebookData.titulo,
    capitulos: Array.from({ length: ebookData.numeroCapitulos || 5 }, (_, i) => ({
      titulo: `Capítulo ${i + 1}`,
      conteudo: `Conteúdo do capítulo ${i + 1} sobre ${ebookData.categoria}`.repeat(20)
    }))
  };

  log(`Conteúdo gerado: ${estrutura.capitulos.length} capítulos`, colors.green);
  return { estrutura, metadata: { totalPalavras: 1000 } };
}

async function processPDFJob(job) {
  log(`Processando job de PDF: ${job.id}`, colors.blue);

  // Simular geração de PDF
  await new Promise(resolve => setTimeout(resolve, 3000));

  const pdfBuffer = Buffer.from(`PDF simulado - ${Date.now()}`);

  log(`PDF gerado: ${pdfBuffer.length} bytes`, colors.green);
  return { pdfBuffer, tamanhoArquivo: pdfBuffer.length, paginasTotais: 10 };
}

async function processUploadJob(job) {
  log(`Processando job de upload: ${job.id}`, colors.blue);

  // Simular upload
  await new Promise(resolve => setTimeout(resolve, 1000));

  const urlPublica = `https://storage.supabase.co/ebooks/${job.data.requestId}/${job.data.nomeArquivo}`;

  log(`Upload concluído: ${urlPublica}`, colors.green);
  return { urlPublica, uploadedAt: new Date().toISOString() };
}

// Criar workers
const contentWorker = new Worker('content-generation', processContentJob, {
  connection: redis,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY_CONTENT) || 2,
});

const pdfWorker = new Worker('pdf-generation', processPDFJob, {
  connection: redis,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY_PDF) || 3,
});

const uploadWorker = new Worker('file-upload', processUploadJob, {
  connection: redis,
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY_UPLOAD) || 4,
});

// Event listeners para fluxo em cadeia
contentWorker.on('completed', async (job, result) => {
  log(`Job de conteúdo completo: ${job.id}`, colors.green);

  try {
    const pdfJobData = {
      ...result,
      userId: job.data.userId,
      requestId: job.data.requestId
    };

    const pdfJob = await pdfQueue.add('generate-pdf', pdfJobData, {
      jobId: `pdf-${job.data.requestId}`,
    });

    log(`Job de PDF criado: ${pdfJob.id}`, colors.blue);
  } catch (error) {
    log(`Erro ao criar job de PDF: ${error.message}`, colors.red);
  }
});

pdfWorker.on('completed', async (job, result) => {
  log(`Job de PDF completo: ${job.id}`, colors.green);

  try {
    const uploadJobData = {
      pdfBuffer: result.pdfBuffer,
      nomeArquivo: `${job.data.estrutura.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      userId: job.data.userId,
      requestId: job.data.requestId,
      metadata: {
        tamanhoArquivo: result.tamanhoArquivo,
        paginasTotais: result.paginasTotais,
        titulo: job.data.estrutura.titulo
      }
    };

    const uploadJob = await uploadQueue.add('upload-pdf', uploadJobData, {
      jobId: `upload-${job.data.requestId}`,
    });

    log(`Job de upload criado: ${uploadJob.id}`, colors.blue);
  } catch (error) {
    log(`Erro ao criar job de upload: ${error.message}`, colors.red);
  }
});

// Event listeners para erros
[contentWorker, pdfWorker, uploadWorker].forEach(worker => {
  worker.on('failed', (job, err) => {
    log(`Job falhou: ${job?.id} - ${err.message}`, colors.red);
  });
});

// Health check server para workers
const app = express();
const port = process.env.WORKERS_PORT || 3001;

app.get('/health', async (req, res) => {
  try {
    await redis.ping();

    const [contentWaiting, pdfWaiting, uploadWaiting] = await Promise.all([
      contentQueue.getWaiting(),
      pdfQueue.getWaiting(),
      uploadQueue.getWaiting(),
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'digitalocean-droplet-workers',
      server: {
        hostname: require('os').hostname(),
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      },
      redis: { connected: true },
      queues: {
        'content-generation': { waiting: contentWaiting.length },
        'pdf-generation': { waiting: pdfWaiting.length },
        'file-upload': { waiting: uploadWaiting.length },
      },
      workers: {
        content: 'running',
        pdf: 'running',
        upload: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar workers
async function startWorkers() {
  try {
    log('Verificando conexão Redis...', colors.blue);
    await redis.ping();
    log('Redis conectado com sucesso', colors.green);

    // Iniciar health check server
    app.listen(port, () => {
      log(`Health check server rodando na porta ${port}`, colors.green);
      log('🎯 Workers prontos para processar jobs!', colors.green);
    });

  } catch (error) {
    log(`Erro fatal: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  log('Encerrando workers...', colors.yellow);
  await redis.disconnect();
  process.exit(0);
});

startWorkers();
EOF

log_success "Workers BullMQ criados"

# 6. Definir permissões corretas
chown -R ebook:ebook $APP_DIR
chmod +x api-gateway-droplet.js workers-droplet.js

log_success "Permissões configuradas"

# 7. Testar instalação básica
log_info "🧪 Testando instalação..."
node --version
npm --version
which chromium-browser

log_success "✅ Deploy da aplicação concluído!"
echo ""
echo "📊 PRÓXIMOS PASSOS:"
echo "  1. Configurar secrets em .env.production"
echo "  2. Executar: 03-setup-ssl.sh"
echo "  3. Iniciar aplicação com PM2"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "  • Editar env: nano $APP_DIR/.env.production"
echo "  • Iniciar app: pm2 start $APP_DIR/api-gateway-droplet.js --name ebook-api"
echo "  • Ver logs: pm2 logs ebook-api"
echo "  • Status: pm2 status"
