#!/usr/bin/env node
// workers/railway-workers.ts
// Workers BullMQ para Railway - Arquitetura Híbrida

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import {
  createContentWorker,
  createPDFWorker,
  createUploadWorker,
  getQueueMetrics,
  cleanupOldJobs
} from '../lib/bullmq-upstash-config';
import {
  upstashRedisConnection,
  verificarConexaoUpstash
} from '../lib/redis-config-upstash';
import { generateEbookStructure, generateEbookPDF } from '../lib/pdf-generator';
import { supabase } from '../lib/supabaseClient';

// Cores para logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Processador de conteúdo (OpenAI)
async function processContentJob(job: any) {
  logInfo(`Processando job de conteúdo: ${job.id}`);

  try {
    const { ebookData, userId, requestId } = job.data;

    logInfo(`Gerando estrutura do ebook: ${ebookData.titulo}`);

    // Usar a função real de geração de estrutura
    const ebookDataFormatted = {
      nome: ebookData.titulo,
      descricao: ebookData.detalhesAdicionais || `Ebook sobre ${ebookData.categoria}`,
      nicho: ebookData.categoria,
      subnicho: ebookData.categoria,
      persona: {
        nome: 'Leitor Interessado',
        idade: '25-45',
        interesses: [ebookData.categoria]
      }
    };

    const estrutura = await generateEbookStructure(ebookDataFormatted);

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
    logError(`Erro no processamento de conteúdo: ${error}`);
    throw error;
  }
}

// Processador de PDF (Puppeteer)
async function processPDFJob(job: any) {
  logInfo(`Processando job de PDF: ${job.id}`);

  try {
    const { estrutura, userId, requestId } = job.data;

    logInfo(`Gerando PDF para: ${estrutura.titulo}`);

    // Usar a função real de geração de PDF
    const pdfBuffer = await generateEbookPDF(estrutura);

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
    logError(`Erro na geração de PDF: ${error}`);
    throw error;
  }
}

// Processador de upload (Supabase)
async function processUploadJob(job: any) {
  logInfo(`Processando job de upload: ${job.id}`);

  try {
    const { pdfBuffer, nomeArquivo, userId, requestId, metadata } = job.data;

    logInfo(`Fazendo upload para Supabase: ${nomeArquivo}`);

    // Gerar caminho único para o arquivo
    const timestamp = Date.now();
    const fileName = nomeArquivo || `ebook_${requestId}_${timestamp}.pdf`;
    const filePath = `ebooks/${userId}/${fileName}`;

    // Upload real para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ebooks')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false // Não sobrescrever arquivos existentes
      });

    if (uploadError) {
      logError(`Erro no upload Supabase: ${uploadError.message}`);
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // Obter URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('ebooks')
      .getPublicUrl(filePath);

    const resultado = {
      urlPublica: urlData.publicUrl,
      nomeArquivo: fileName,
      tamanhoArquivo: pdfBuffer.length,
      uploadedAt: new Date().toISOString(),
      filePath: filePath,
      metadata: metadata || {}
    };

    logSuccess(`Upload concluído para ${userId}: ${fileName} (${(resultado.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB)`);

    return resultado;
  } catch (error) {
    logError(`Erro no upload: ${error}`);
    throw error;
  }
}

// Health check endpoint
async function createHealthCheckServer() {
  const express = require('express');
  const app = express();
  const port = process.env.PORT || 3001;

  // Middleware básico
  app.use(express.json());
  
  app.get('/health', async (req: any, res: any) => {
    try {
      // Verificar conexão Redis
      const redisStatus = await verificarConexaoUpstash();
      
      // Obter métricas das filas
      const metrics = await getQueueMetrics();
      
      const healthStatus = {
        status: redisStatus.connected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        redis: {
          connected: redisStatus.connected,
          latency: redisStatus.latency
        },
        queues: metrics,
        workers: {
          content: 'running',
          pdf: 'running',
          upload: 'running'
        }
      };
      
      res.status(redisStatus.connected ? 200 : 503).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  app.listen(port, () => {
    logInfo(`Health check server rodando na porta ${port}`);
  });
}

// Função principal
async function startWorkers() {
  logInfo('🚀 Iniciando Workers BullMQ - Railway Hybrid Architecture');
  
  try {
    // Verificar conexão Redis
    logInfo('Verificando conexão com Upstash Redis...');
    const redisStatus = await verificarConexaoUpstash();
    
    if (!redisStatus.connected) {
      throw new Error(`Falha na conexão Redis: ${redisStatus.error}`);
    }
    
    logSuccess(`Redis conectado - Latência: ${redisStatus.latency}ms`);
    
    // Criar workers
    logInfo('Criando workers BullMQ...');
    
    const contentWorker = createContentWorker(processContentJob);
    const pdfWorker = createPDFWorker(processPDFJob);
    const uploadWorker = createUploadWorker(processUploadJob);
    
    // Event listeners para monitoramento e fluxo em cadeia
    contentWorker.on('completed', async (job, result) => {
      logSuccess(`Job de conteúdo completo: ${job.id}`);

      try {
        // Automaticamente criar job de PDF após conteúdo
        const { pdfQueue } = await import('../lib/bullmq-upstash-config');

        const pdfJobData = {
          ...result,
          userId: job.data.userId,
          requestId: job.data.requestId
        };

        const pdfJob = await pdfQueue.add('generate-pdf', pdfJobData, {
          jobId: `pdf-${job.data.requestId}`,
          priority: 5
        });

        logInfo(`Job de PDF criado automaticamente: ${pdfJob.id}`);
      } catch (error) {
        logError(`Erro ao criar job de PDF: ${error}`);
      }
    });

    contentWorker.on('failed', (job, err) => {
      logError(`Job de conteúdo falhou: ${job?.id} - ${err.message}`);
    });
    
    pdfWorker.on('completed', async (job, result) => {
      logSuccess(`Job de PDF completo: ${job.id}`);

      try {
        // Automaticamente criar job de upload após PDF
        const { uploadQueue } = await import('../lib/bullmq-upstash-config');

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
          priority: 1
        });

        logInfo(`Job de upload criado automaticamente: ${uploadJob.id}`);
      } catch (error) {
        logError(`Erro ao criar job de upload: ${error}`);
      }
    });

    pdfWorker.on('failed', (job, err) => {
      logError(`Job de PDF falhou: ${job?.id} - ${err.message}`);
    });
    
    uploadWorker.on('completed', (job) => {
      logSuccess(`Job de upload completo: ${job.id}`);
    });
    
    uploadWorker.on('failed', (job, err) => {
      logError(`Job de upload falhou: ${job?.id} - ${err.message}`);
    });
    
    logSuccess('Workers BullMQ iniciados com sucesso!');
    
    // Iniciar servidor de health check
    await createHealthCheckServer();
    
    // Limpeza automática a cada 30 minutos
    setInterval(async () => {
      try {
        await cleanupOldJobs();
        logInfo('Limpeza automática de jobs antigos executada');
      } catch (error) {
        logWarning(`Erro na limpeza automática: ${error}`);
      }
    }, 30 * 60 * 1000);
    
    // Log de métricas a cada 5 minutos
    setInterval(async () => {
      try {
        const metrics = await getQueueMetrics();
        logInfo('📊 Métricas das filas:');
        Object.entries(metrics).forEach(([nome, stats]) => {
          logInfo(`   ${nome}: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
        });
      } catch (error) {
        logWarning(`Erro ao obter métricas: ${error}`);
      }
    }, 5 * 60 * 1000);
    
    logInfo('🎯 Workers prontos para processar jobs!');
    
  } catch (error) {
    logError(`Erro fatal ao iniciar workers: ${error}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logInfo('🛑 Recebido SIGTERM, encerrando workers...');
  await upstashRedisConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logInfo('🛑 Recebido SIGINT, encerrando workers...');
  await upstashRedisConnection.disconnect();
  process.exit(0);
});

// Iniciar workers
if (require.main === module) {
  startWorkers().catch((error) => {
    logError(`Erro fatal: ${error}`);
    process.exit(1);
  });
}

export { startWorkers };
