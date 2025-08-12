#!/usr/bin/env node
// workers/digitalocean-workers.js
// Workers BullMQ para DigitalOcean App Platform - Sistema de Geração de Ebooks

const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const express = require('express');

console.log('🚀 Iniciando Workers BullMQ DigitalOcean...');
console.log('Environment:', process.env.NODE_ENV);

// Configuração Redis DigitalOcean Valkey
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Obrigatório para BullMQ
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

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Processador de conteúdo (OpenAI)
async function processContentJob(job) {
  logInfo(`Processando job de conteúdo: ${job.id}`);
  
  try {
    const { ebookData, userId, requestId } = job.data;
    
    logInfo(`Gerando estrutura do ebook: ${ebookData.titulo}`);
    
    // Simular geração de conteúdo (substituir pela lógica real)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular tempo de processamento
    
    const estrutura = {
      titulo: ebookData.titulo,
      capitulos: Array.from({ length: ebookData.numeroCapitulos || 5 }, (_, i) => ({
        titulo: `Capítulo ${i + 1}`,
        conteudo: `Conteúdo detalhado do capítulo ${i + 1} sobre ${ebookData.categoria}. Este é um conteúdo simulado que seria gerado pela OpenAI API.`.repeat(10)
      }))
    };
    
    // Calcular metadata
    const totalPalavras = estrutura.capitulos.reduce((total, cap) => {
      return total + cap.conteudo.length / 5; // Aproximação: 5 chars = 1 palavra
    }, 0);
    
    const metadata = {
      totalPalavras: Math.round(totalPalavras),
      tempoEstimadoLeitura: Math.ceil(totalPalavras / 200) // 200 palavras por minuto
    };
    
    logSuccess(`Conteúdo gerado para ${userId}: ${estrutura.capitulos.length} capítulos, ${metadata.totalPalavras} palavras`);
    
    return { estrutura, metadata };
  } catch (error) {
    logError(`Erro no processamento de conteúdo: ${error.message}`);
    throw error;
  }
}

// Processador de PDF (Puppeteer)
async function processPDFJob(job) {
  logInfo(`Processando job de PDF: ${job.id}`);
  
  try {
    const { estrutura, userId, requestId } = job.data;
    
    logInfo(`Gerando PDF para: ${estrutura.titulo}`);
    
    // Simular geração de PDF
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simular tempo de processamento
    
    const pdfBuffer = Buffer.from(`PDF simulado para ${estrutura.titulo} - ${Date.now()}`);
    
    // Calcular número aproximado de páginas (baseado no tamanho do conteúdo)
    const totalConteudo = estrutura.capitulos.reduce((total, cap) => {
      return total + cap.conteudo.length;
    }, 0);
    
    // Aproximação: 2500 caracteres por página A4
    const paginasEstimadas = Math.max(1, Math.ceil(totalConteudo / 2500));
    
    const resultado = {
      pdfBuffer,
      tamanhoArquivo: pdfBuffer.length,
      paginasTotais: paginasEstimadas
    };
    
    logSuccess(`PDF gerado para ${userId}: ${(resultado.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB, ~${resultado.paginasTotais} páginas`);
    
    return resultado;
  } catch (error) {
    logError(`Erro na geração de PDF: ${error.message}`);
    throw error;
  }
}

// Processador de upload (Supabase)
async function processUploadJob(job) {
  logInfo(`Processando job de upload: ${job.id}`);
  
  try {
    const { pdfBuffer, nomeArquivo, userId, requestId, metadata } = job.data;
    
    logInfo(`Fazendo upload simulado para Supabase: ${nomeArquivo}`);
    
    // Simular upload
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simular tempo de upload
    
    const urlPublica = `https://storage.supabase.co/ebooks/${requestId}/${nomeArquivo}`;
    
    const resultado = {
      urlPublica,
      nomeArquivo,
      tamanhoArquivo: pdfBuffer.length,
      uploadedAt: new Date().toISOString(),
      filePath: `ebooks/${userId}/${nomeArquivo}`,
      metadata: metadata || {}
    };
    
    logSuccess(`Upload concluído para ${userId}: ${nomeArquivo} (${(resultado.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB)`);
    
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

// Health check server para workers
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
      service: 'digitalocean-workers',
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

// Iniciar workers
async function startWorkers() {
  try {
    logInfo('🚀 Iniciando Workers BullMQ DigitalOcean');
    
    // Verificar conexão Redis
    await redis.ping();
    logSuccess('Redis conectado com sucesso');
    
    // Iniciar servidor HTTP para health check
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
