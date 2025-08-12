#!/usr/bin/env node
// workers/railway-workers-simple.js
// Workers BullMQ simplificados para Railway

// Carregar variáveis de ambiente (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    console.log('dotenv não disponível, usando variáveis do sistema');
  }
}

const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const express = require('express');

// Debug das variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente:');
console.log('UPSTASH_REDIS_HOST:', process.env.UPSTASH_REDIS_HOST ? 'SET' : 'NOT SET');
console.log('UPSTASH_REDIS_PASSWORD:', process.env.UPSTASH_REDIS_PASSWORD ? 'SET' : 'NOT SET');

// Configuração Redis Upstash
const redis = new Redis({
  host: process.env.UPSTASH_REDIS_HOST || 'integral-katydid-16901.upstash.io',
  port: parseInt(process.env.UPSTASH_REDIS_PORT) || 6379,
  username: process.env.UPSTASH_REDIS_USERNAME || 'default',
  password: process.env.UPSTASH_REDIS_PASSWORD || process.env.REDIS_PASSWORD,
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

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Processador de conteúdo simulado
async function processContentJob(job) {
  logInfo(`Processando job de conteúdo: ${job.id}`);
  
  try {
    const { ebookData, userId, requestId } = job.data;
    
    // Simular geração de conteúdo (substituir pela lógica real)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tempo de processamento
    
    const estrutura = {
      titulo: ebookData.titulo,
      capitulos: Array.from({ length: ebookData.numeroCapitulos || 5 }, (_, i) => ({
        titulo: `Capítulo ${i + 1}`,
        conteudo: `Conteúdo detalhado do capítulo ${i + 1} sobre ${ebookData.categoria}. Este é um conteúdo simulado que seria gerado pela OpenAI API.`.repeat(10)
      }))
    };
    
    const metadata = {
      totalPalavras: estrutura.capitulos.length * 500,
      tempoEstimadoLeitura: Math.ceil((estrutura.capitulos.length * 500) / 200)
    };
    
    logSuccess(`Conteúdo gerado para ${userId}: ${estrutura.capitulos.length} capítulos`);
    
    return { estrutura, metadata };
  } catch (error) {
    logError(`Erro no processamento de conteúdo: ${error.message}`);
    throw error;
  }
}

// Processador de PDF simulado
async function processPDFJob(job) {
  logInfo(`Processando job de PDF: ${job.id}`);
  
  try {
    const { estrutura, userId, requestId } = job.data;
    
    // Simular geração de PDF
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simular tempo de processamento
    
    const pdfBuffer = Buffer.from(`PDF simulado para ${estrutura.titulo} - ${Date.now()}`);
    
    const resultado = {
      pdfBuffer,
      tamanhoArquivo: pdfBuffer.length,
      paginasTotais: estrutura.capitulos.length * 2
    };
    
    logSuccess(`PDF gerado para ${userId}: ${resultado.paginasTotais} páginas`);
    
    return resultado;
  } catch (error) {
    logError(`Erro na geração de PDF: ${error.message}`);
    throw error;
  }
}

// Processador de upload simulado
async function processUploadJob(job) {
  logInfo(`Processando job de upload: ${job.id}`);
  
  try {
    const { pdfBuffer, nomeArquivo, userId, requestId } = job.data;
    
    // Simular upload
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular tempo de upload
    
    const urlPublica = `https://storage.supabase.co/ebooks/${requestId}/${nomeArquivo}`;
    
    const resultado = {
      urlPublica,
      nomeArquivo,
      tamanhoArquivo: pdfBuffer.length,
      uploadedAt: new Date().toISOString()
    };
    
    logSuccess(`Upload concluído para ${userId}: ${urlPublica}`);
    
    return resultado;
  } catch (error) {
    logError(`Erro no upload: ${error.message}`);
    throw error;
  }
}

// Criar workers
const contentWorker = new Worker('content-generation', processContentJob, {
  connection: redis,
  concurrency: 3,
});

const pdfWorker = new Worker('pdf-generation', processPDFJob, {
  connection: redis,
  concurrency: 5,
});

const uploadWorker = new Worker('file-upload', processUploadJob, {
  connection: redis,
  concurrency: 8,
});

// Event listeners para fluxo em cadeia
contentWorker.on('completed', async (job, result) => {
  logSuccess(`Job de conteúdo completo: ${job.id}`);
  
  try {
    // Criar job de PDF automaticamente
    const pdfJobData = {
      ...result,
      userId: job.data.userId,
      requestId: job.data.requestId
    };
    
    const pdfJob = await pdfQueue.add('generate-pdf', pdfJobData, {
      jobId: `pdf-${job.data.requestId}`,
    });
    
    logInfo(`Job de PDF criado automaticamente: ${pdfJob.id}`);
  } catch (error) {
    logError(`Erro ao criar job de PDF: ${error.message}`);
  }
});

pdfWorker.on('completed', async (job, result) => {
  logSuccess(`Job de PDF completo: ${job.id}`);
  
  try {
    // Criar job de upload automaticamente
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
    
    logInfo(`Job de upload criado automaticamente: ${uploadJob.id}`);
  } catch (error) {
    logError(`Erro ao criar job de upload: ${error.message}`);
  }
});

// Event listeners para erros
contentWorker.on('failed', (job, err) => {
  logError(`Job de conteúdo falhou: ${job?.id} - ${err.message}`);
});

pdfWorker.on('failed', (job, err) => {
  logError(`Job de PDF falhou: ${job?.id} - ${err.message}`);
});

uploadWorker.on('failed', (job, err) => {
  logError(`Job de upload falhou: ${job?.id} - ${err.message}`);
});

// Health check server
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    // Verificar conexão Redis
    await redis.ping();
    
    // Obter métricas das filas
    const [contentWaiting, pdfWaiting, uploadWaiting] = await Promise.all([
      contentQueue.getWaiting(),
      pdfQueue.getWaiting(),
      uploadQueue.getWaiting(),
    ]);
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
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
    };
    
    res.json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Função para adicionar job (para testes)
app.post('/test-job', async (req, res) => {
  try {
    const jobData = {
      userId: 'test-user',
      ebookData: {
        titulo: 'Ebook de Teste',
        categoria: 'Tecnologia',
        numeroCapitulos: 3,
      },
      requestId: `test-${Date.now()}`,
      timestamp: Date.now()
    };
    
    const job = await contentQueue.add('generate-ebook-content', jobData);
    
    res.json({
      success: true,
      jobId: job.id,
      message: 'Job de teste criado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
async function startWorkers() {
  try {
    logInfo('🚀 Iniciando Workers BullMQ Simplificados - Railway');
    
    // Verificar conexão Redis
    await redis.ping();
    logSuccess('Redis conectado com sucesso');
    
    // Iniciar servidor HTTP
    app.listen(port, () => {
      logSuccess(`Health check server rodando na porta ${port}`);
      logInfo('🎯 Workers prontos para processar jobs!');
    });
    
  } catch (error) {
    logError(`Erro fatal ao iniciar workers: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logInfo('🛑 Recebido SIGTERM, encerrando workers...');
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('🛑 Recebido SIGINT, encerrando workers...');
  await redis.disconnect();
  process.exit(0);
});

// Iniciar workers
startWorkers().catch((error) => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});

// Exportar para testes
module.exports = {
  contentQueue,
  pdfQueue,
  uploadQueue,
  redis
};
