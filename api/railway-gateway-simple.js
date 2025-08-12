#!/usr/bin/env node
// api/railway-gateway-simple.js
// API Gateway simplificado para comunicação Vercel <-> Railway

// Carregar variáveis de ambiente (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.log('dotenv não disponível, usando variáveis do sistema');
  }
}

const express = require('express');
const cors = require('cors');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 3000;

// Configuração Redis Upstash
const redis = new Redis({
  host: process.env.UPSTASH_REDIS_HOST || 'integral-katydid-16901.upstash.io',
  port: parseInt(process.env.UPSTASH_REDIS_PORT) || 6379,
  username: process.env.UPSTASH_REDIS_USERNAME || 'default',
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: true,
  },
  connectTimeout: 10000,
  commandTimeout: 8000,
  lazyConnect: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: null, // Obrigatório para BullMQ
  retryStrategy: (times) => Math.min(times * 100, 3000),
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

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
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

// Middleware de autenticação simples
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
      service: 'api-gateway',
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
    
    // Validação básica
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
    
    // Gerar ID único para o request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar job na fila
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

// Endpoint para verificar status do job (protegido)
app.get('/api/ebooks/status/:jobId', authenticateAPI, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'jobId é obrigatório'
      });
    }
    
    // Tentar encontrar o job em todas as filas
    let job = null;
    let queueName = '';
    
    try {
      job = await contentQueue.getJob(jobId);
      queueName = 'content-generation';
    } catch (e) {}
    
    if (!job) {
      try {
        job = await pdfQueue.getJob(jobId.replace('ebook-', 'pdf-'));
        queueName = 'pdf-generation';
      } catch (e) {}
    }
    
    if (!job) {
      try {
        job = await uploadQueue.getJob(jobId.replace('ebook-', 'upload-'));
        queueName = 'file-upload';
      } catch (e) {}
    }
    
    if (!job) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job não encontrado'
      });
    }
    
    const state = await job.getState();
    
    const jobStatus = {
      id: job.id,
      status: state,
      queue: queueName,
      progress: job.progress || 0,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
    };
    
    log(`Status consultado para job: ${jobId} - ${state}`, colors.blue);
    
    res.json({
      success: true,
      data: jobStatus
    });
    
  } catch (error) {
    log(`Erro ao consultar status: ${error.message}`, colors.red);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para métricas das filas (protegido)
app.get('/api/metrics', authenticateAPI, async (req, res) => {
  try {
    const [
      contentWaiting, contentActive, contentCompleted, contentFailed,
      pdfWaiting, pdfActive, pdfCompleted, pdfFailed,
      uploadWaiting, uploadActive, uploadCompleted, uploadFailed
    ] = await Promise.all([
      contentQueue.getWaiting(), contentQueue.getActive(), contentQueue.getCompleted(), contentQueue.getFailed(),
      pdfQueue.getWaiting(), pdfQueue.getActive(), pdfQueue.getCompleted(), pdfQueue.getFailed(),
      uploadQueue.getWaiting(), uploadQueue.getActive(), uploadQueue.getCompleted(), uploadQueue.getFailed(),
    ]);
    
    const metrics = {
      'content-generation': {
        waiting: contentWaiting.length,
        active: contentActive.length,
        completed: contentCompleted.length,
        failed: contentFailed.length,
      },
      'pdf-generation': {
        waiting: pdfWaiting.length,
        active: pdfActive.length,
        completed: pdfCompleted.length,
        failed: pdfFailed.length,
      },
      'file-upload': {
        waiting: uploadWaiting.length,
        active: uploadActive.length,
        completed: uploadCompleted.length,
        failed: uploadFailed.length,
      },
    };
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        queues: metrics
      }
    });
    
    log('Métricas consultadas', colors.blue);
    
  } catch (error) {
    log(`Erro ao obter métricas: ${error.message}`, colors.red);
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
    message: 'API Gateway funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    // Verificar conexão Redis antes de iniciar
    log('Verificando conexão com Upstash Redis...', colors.blue);
    await redis.ping();
    log('Redis conectado com sucesso', colors.green);
    
    // Iniciar servidor HTTP
    app.listen(port, () => {
      log(`🚀 API Gateway rodando na porta ${port}`, colors.green);
      log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
      log(`🔗 Health check: http://localhost:${port}/health`, colors.blue);
      log(`📊 Métricas: http://localhost:${port}/api/metrics`, colors.blue);
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

// Iniciar servidor
startServer().catch((error) => {
  log(`Erro fatal: ${error.message}`, colors.red);
  process.exit(1);
});

module.exports = { app, redis };
