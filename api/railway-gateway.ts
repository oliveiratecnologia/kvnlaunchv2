#!/usr/bin/env node
// api/railway-gateway.ts
// API Gateway para comunicação Vercel <-> Railway

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import express from 'express';
import cors from 'cors';
import { 
  addEbookJob, 
  getJobStatus, 
  getQueueMetrics 
} from '../lib/bullmq-upstash-config';
import { verificarConexaoUpstash } from '../lib/redis-config-upstash';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Middleware de autenticação simples
const authenticateAPI = (req: any, res: any, next: any) => {
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

// Logs coloridos
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

function log(message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Health check endpoint (público)
app.get('/health', async (req, res) => {
  try {
    const redisStatus = await verificarConexaoUpstash();
    const metrics = await getQueueMetrics();
    
    const healthStatus = {
      status: redisStatus.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      redis: {
        connected: redisStatus.connected,
        latency: redisStatus.latency
      },
      queues: metrics
    };
    
    res.status(redisStatus.connected ? 200 : 503).json(healthStatus);
    
    log(`Health check: ${redisStatus.connected ? 'OK' : 'FAIL'}`, 
        redisStatus.connected ? colors.green : colors.red);
        
  } catch (error) {
    log(`Erro no health check: ${error}`, colors.red);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
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
    
    if (!ebookData.titulo || !ebookData.categoria || !ebookData.numeroCapitulos) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'ebookData deve conter titulo, categoria e numeroCapitulos'
      });
    }
    
    // Gerar ID único para o request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar job na fila
    const jobData = {
      userId,
      ebookData,
      requestId,
      timestamp: Date.now()
    };
    
    const jobId = await addEbookJob(jobData);
    
    log(`Novo job criado: ${jobId} para usuário ${userId}`, colors.green);
    
    res.status(202).json({
      success: true,
      message: 'Ebook adicionado à fila de processamento',
      data: {
        jobId,
        requestId,
        status: 'queued',
        estimatedTime: '2-5 minutos'
      }
    });
    
  } catch (error) {
    log(`Erro ao criar job: ${error}`, colors.red);
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
    
    const jobStatus = await getJobStatus(jobId);
    
    log(`Status consultado para job: ${jobId} - ${jobStatus.status}`, colors.blue);
    
    res.json({
      success: true,
      data: jobStatus
    });
    
  } catch (error) {
    log(`Erro ao consultar status: ${error}`, colors.red);
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Job não encontrado'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para métricas das filas (protegido)
app.get('/api/metrics', authenticateAPI, async (req, res) => {
  try {
    const metrics = await getQueueMetrics();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        queues: metrics
      }
    });
    
    log('Métricas consultadas', colors.blue);
    
  } catch (error) {
    log(`Erro ao obter métricas: ${error}`, colors.red);
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
app.use((error: any, req: any, res: any, next: any) => {
  log(`Erro não tratado: ${error.message}`, colors.red);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
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
    const redisStatus = await verificarConexaoUpstash();
    
    if (!redisStatus.connected) {
      throw new Error(`Falha na conexão Redis: ${redisStatus.error}`);
    }
    
    log(`Redis conectado - Latência: ${redisStatus.latency}ms`, colors.green);
    
    // Iniciar servidor HTTP
    app.listen(port, () => {
      log(`🚀 API Gateway rodando na porta ${port}`, colors.green);
      log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
      log(`🔗 Health check: http://localhost:${port}/health`, colors.blue);
      log(`📊 Métricas: http://localhost:${port}/api/metrics`, colors.blue);
    });
    
  } catch (error) {
    log(`Erro fatal ao iniciar servidor: ${error}`, colors.red);
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
if (require.main === module) {
  startServer().catch((error) => {
    log(`Erro fatal: ${error}`, colors.red);
    process.exit(1);
  });
}

export { app };
