// lib/bullmq-upstash-config.ts
import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { 
  upstashRedisConnection, 
  upstashBullMQConfig, 
  createUpstashWorkerConfig 
} from './redis-config-upstash';

// Tipos para os jobs do sistema de ebooks
export interface EbookJobData {
  userId: string;
  ebookData: {
    titulo: string;
    categoria: string;
    numeroCapitulos: number;
    detalhesAdicionais?: string;
  };
  requestId: string;
  timestamp: number;
}

export interface ContentJobResult {
  estrutura: {
    titulo: string;
    capitulos: Array<{
      titulo: string;
      conteudo: string;
    }>;
  };
  metadata: {
    totalPalavras: number;
    tempoEstimadoLeitura: number;
  };
}

export interface PDFJobData extends ContentJobResult {
  userId: string;
  requestId: string;
}

export interface PDFJobResult {
  pdfBuffer: Buffer;
  tamanhoArquivo: number;
  paginasTotais: number;
}

export interface UploadJobData {
  userId: string;
  requestId: string;
  pdfBuffer: Buffer;
  nomeArquivo: string;
  metadata: {
    tamanhoArquivo: number;
    paginasTotais: number;
  };
}

export interface UploadJobResult {
  urlPublica: string;
  nomeArquivo: string;
  tamanhoArquivo: number;
  uploadedAt: string;
}

// Configurações específicas para cada tipo de fila
const queueConfigs = {
  // Fila de geração de conteúdo (prioridade alta)
  contentGeneration: {
    name: 'content-generation',
    priority: 10,
    concurrency: 3, // Reduzido para Upstash
    timeout: 120000, // 2 minutos
  },
  
  // Fila de geração de PDF (prioridade média)
  pdfGeneration: {
    name: 'pdf-generation',
    priority: 5,
    concurrency: 5, // Reduzido para Upstash
    timeout: 300000, // 5 minutos
  },
  
  // Fila de upload (prioridade baixa)
  fileUpload: {
    name: 'file-upload',
    priority: 1,
    concurrency: 8, // Reduzido para Upstash
    timeout: 60000, // 1 minuto
  },
};

// Criar filas otimizadas para Upstash
export const contentQueue = new Queue<EbookJobData, ContentJobResult>(
  queueConfigs.contentGeneration.name,
  {
    ...upstashBullMQConfig,
    defaultJobOptions: {
      ...upstashBullMQConfig.defaultJobOptions,
      priority: queueConfigs.contentGeneration.priority,
      
      // Configurações específicas para geração de conteúdo
      delay: 0,
      removeOnComplete: 5, // Manter menos jobs para economizar memória
      removeOnFail: 3,
      
      // Retry específico para OpenAI API
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 segundos inicial
      },
    },
  }
);

export const pdfQueue = new Queue<PDFJobData, PDFJobResult>(
  queueConfigs.pdfGeneration.name,
  {
    ...upstashBullMQConfig,
    defaultJobOptions: {
      ...upstashBullMQConfig.defaultJobOptions,
      priority: queueConfigs.pdfGeneration.priority,
      
      // Configurações específicas para geração de PDF
      removeOnComplete: 3, // PDFs são grandes, manter menos
      removeOnFail: 2,
      
      // Retry para Puppeteer
      attempts: 2, // Menos tentativas para PDFs (são caros)
      backoff: {
        type: 'fixed',
        delay: 10000, // 10 segundos fixo
      },
    },
  }
);

export const uploadQueue = new Queue<UploadJobData, UploadJobResult>(
  queueConfigs.fileUpload.name,
  {
    ...upstashBullMQConfig,
    defaultJobOptions: {
      ...upstashBullMQConfig.defaultJobOptions,
      priority: queueConfigs.fileUpload.priority,
      
      // Configurações específicas para upload
      removeOnComplete: 10, // Uploads são rápidos, pode manter mais
      removeOnFail: 5,
      
      // Retry para Supabase
      attempts: 5, // Mais tentativas para uploads (são mais confiáveis)
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }
);

// Função para criar workers otimizados para Upstash
export function createContentWorker(
  processor: (job: any) => Promise<ContentJobResult>
): Worker<EbookJobData, ContentJobResult> {
  const config = createUpstashWorkerConfig(queueConfigs.contentGeneration.concurrency);
  
  return new Worker(
    queueConfigs.contentGeneration.name,
    processor,
    {
      ...config,
      
      // Configurações específicas do worker de conteúdo
      settings: {
        ...config.settings,
        // Timeout específico para OpenAI
        jobTimeout: queueConfigs.contentGeneration.timeout,
      },
    }
  );
}

export function createPDFWorker(
  processor: (job: any) => Promise<PDFJobResult>
): Worker<PDFJobData, PDFJobResult> {
  const config = createUpstashWorkerConfig(queueConfigs.pdfGeneration.concurrency);
  
  return new Worker(
    queueConfigs.pdfGeneration.name,
    processor,
    {
      ...config,
      
      // Configurações específicas do worker de PDF
      settings: {
        ...config.settings,
        // Timeout maior para geração de PDF
        jobTimeout: queueConfigs.pdfGeneration.timeout,
      },
    }
  );
}

export function createUploadWorker(
  processor: (job: any) => Promise<UploadJobResult>
): Worker<UploadJobData, UploadJobResult> {
  const config = createUpstashWorkerConfig(queueConfigs.fileUpload.concurrency);
  
  return new Worker(
    queueConfigs.fileUpload.name,
    processor,
    {
      ...config,
      
      // Configurações específicas do worker de upload
      settings: {
        ...config.settings,
        // Timeout para uploads
        jobTimeout: queueConfigs.fileUpload.timeout,
      },
    }
  );
}

// Função para adicionar job com tracking
export async function addEbookJob(
  jobData: EbookJobData,
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
  }
): Promise<string> {
  const job = await contentQueue.add(
    'generate-ebook-content',
    jobData,
    {
      // Usar configurações padrão ou sobrescrever
      priority: options?.priority || queueConfigs.contentGeneration.priority,
      delay: options?.delay || 0,
      attempts: options?.attempts || 3,
      
      // ID único para tracking
      jobId: `ebook-${jobData.requestId}`,
      
      // Metadata para debugging
      metadata: {
        userId: jobData.userId,
        timestamp: Date.now(),
        source: 'api-vercel',
      },
    }
  );
  
  console.log(`📝 Job de conteúdo adicionado: ${job.id} para usuário ${jobData.userId}`);
  return job.id!;
}

// Função para obter status de job
export async function getJobStatus(jobId: string): Promise<{
  id: string;
  status: string;
  progress: number;
  data?: any;
  result?: any;
  error?: string;
  createdAt?: number;
  processedAt?: number;
  finishedAt?: number;
}> {
  // Tentar encontrar o job em todas as filas
  const queues = [contentQueue, pdfQueue, uploadQueue];
  
  for (const queue of queues) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        return {
          id: job.id!,
          status: await job.getState(),
          progress: job.progress,
          data: job.data,
          result: job.returnvalue,
          error: job.failedReason,
          createdAt: job.timestamp,
          processedAt: job.processedOn,
          finishedAt: job.finishedOn,
        };
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao buscar job ${jobId} na fila ${queue.name}:`, error);
    }
  }
  
  throw new Error(`Job ${jobId} não encontrado em nenhuma fila`);
}

// Função para limpar jobs antigos (economizar memória no Upstash)
export async function cleanupOldJobs(): Promise<void> {
  const queues = [contentQueue, pdfQueue, uploadQueue];
  
  for (const queue of queues) {
    try {
      // Limpar jobs completos mais antigos que 1 hora
      await queue.clean(60 * 60 * 1000, 100, 'completed');
      
      // Limpar jobs falhados mais antigos que 6 horas
      await queue.clean(6 * 60 * 60 * 1000, 50, 'failed');
      
      console.log(`🧹 Limpeza realizada na fila ${queue.name}`);
    } catch (error) {
      console.error(`❌ Erro na limpeza da fila ${queue.name}:`, error);
    }
  }
}

// Função para obter métricas das filas
export async function getQueueMetrics(): Promise<{
  [queueName: string]: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}> {
  const queues = [
    { name: 'content-generation', queue: contentQueue },
    { name: 'pdf-generation', queue: pdfQueue },
    { name: 'file-upload', queue: uploadQueue },
  ];
  
  const metrics: any = {};
  
  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);
      
      metrics[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      console.error(`❌ Erro ao obter métricas da fila ${name}:`, error);
      metrics[name] = {
        waiting: -1,
        active: -1,
        completed: -1,
        failed: -1,
        delayed: -1,
      };
    }
  }
  
  return metrics;
}

// Event listeners para monitoramento
contentQueue.on('completed', (job) => {
  console.log(`✅ Job de conteúdo completo: ${job.id}`);
});

contentQueue.on('failed', (job, err) => {
  console.error(`❌ Job de conteúdo falhou: ${job?.id}`, err.message);
});

pdfQueue.on('completed', (job) => {
  console.log(`📄 Job de PDF completo: ${job.id}`);
});

pdfQueue.on('failed', (job, err) => {
  console.error(`❌ Job de PDF falhou: ${job?.id}`, err.message);
});

uploadQueue.on('completed', (job) => {
  console.log(`☁️ Job de upload completo: ${job.id}`);
});

uploadQueue.on('failed', (job, err) => {
  console.error(`❌ Job de upload falhou: ${job?.id}`, err.message);
});

// Agendar limpeza automática a cada 30 minutos
setInterval(cleanupOldJobs, 30 * 60 * 1000);
