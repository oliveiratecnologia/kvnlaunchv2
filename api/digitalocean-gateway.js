#!/usr/bin/env node
// api/digitalocean-gateway.js
// API Gateway para DigitalOcean App Platform - Sistema de Geração de Ebooks

const express = require('express');
const cors = require('cors');
const { Queue } = require('bullmq');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 Iniciando API Gateway DigitalOcean...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);

// Configuração Redis DigitalOcean Valkey
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Obrigatório para BullMQ
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

// CORS configurado para Vercel
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

// Endpoint raiz - Informações da API (público)
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'DigitalOcean Ebook Generator API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      test: '/api/test',
      generate: '/api/ebooks/generate (POST)',
      status: '/api/ebooks/status/:jobId (GET)'
    },
    documentation: 'https://github.com/oliveiratecnologia/kvnlaunchv2'
  });
});

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
      service: 'digitalocean-api-gateway',
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

// Endpoint de teste (público)
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'DigitalOcean API Gateway funcionando!',
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
    log('Verificando conexão com DigitalOcean Redis...', colors.blue);
    await redis.ping();
    log('Redis conectado com sucesso', colors.green);
    
    // Iniciar servidor HTTP
    app.listen(port, () => {
      log(`🚀 API Gateway DigitalOcean rodando na porta ${port}`, colors.green);
      log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
      log(`🔗 Health check: http://localhost:${port}/health`, colors.blue);
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
