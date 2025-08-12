"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadQueue = exports.pdfQueue = exports.contentQueue = void 0;
exports.createContentWorker = createContentWorker;
exports.createPDFWorker = createPDFWorker;
exports.createUploadWorker = createUploadWorker;
exports.addEbookJob = addEbookJob;
exports.getJobStatus = getJobStatus;
exports.cleanupOldJobs = cleanupOldJobs;
exports.getQueueMetrics = getQueueMetrics;
const bullmq_1 = require("bullmq");
const redis_config_upstash_1 = require("./redis-config-upstash");
const queueConfigs = {
    contentGeneration: {
        name: 'content-generation',
        priority: 10,
        concurrency: 3,
        timeout: 120000,
    },
    pdfGeneration: {
        name: 'pdf-generation',
        priority: 5,
        concurrency: 5,
        timeout: 300000,
    },
    fileUpload: {
        name: 'file-upload',
        priority: 1,
        concurrency: 8,
        timeout: 60000,
    },
};
exports.contentQueue = new bullmq_1.Queue(queueConfigs.contentGeneration.name, {
    ...redis_config_upstash_1.upstashBullMQConfig,
    defaultJobOptions: {
        ...redis_config_upstash_1.upstashBullMQConfig.defaultJobOptions,
        priority: queueConfigs.contentGeneration.priority,
        delay: 0,
        removeOnComplete: 5,
        removeOnFail: 3,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },
});
exports.pdfQueue = new bullmq_1.Queue(queueConfigs.pdfGeneration.name, {
    ...redis_config_upstash_1.upstashBullMQConfig,
    defaultJobOptions: {
        ...redis_config_upstash_1.upstashBullMQConfig.defaultJobOptions,
        priority: queueConfigs.pdfGeneration.priority,
        removeOnComplete: 3,
        removeOnFail: 2,
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 10000,
        },
    },
});
exports.uploadQueue = new bullmq_1.Queue(queueConfigs.fileUpload.name, {
    ...redis_config_upstash_1.upstashBullMQConfig,
    defaultJobOptions: {
        ...redis_config_upstash_1.upstashBullMQConfig.defaultJobOptions,
        priority: queueConfigs.fileUpload.priority,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});
function createContentWorker(processor) {
    const config = (0, redis_config_upstash_1.createUpstashWorkerConfig)(queueConfigs.contentGeneration.concurrency);
    return new bullmq_1.Worker(queueConfigs.contentGeneration.name, processor, {
        ...config,
        settings: {
            ...config.settings,
            jobTimeout: queueConfigs.contentGeneration.timeout,
        },
    });
}
function createPDFWorker(processor) {
    const config = (0, redis_config_upstash_1.createUpstashWorkerConfig)(queueConfigs.pdfGeneration.concurrency);
    return new bullmq_1.Worker(queueConfigs.pdfGeneration.name, processor, {
        ...config,
        settings: {
            ...config.settings,
            jobTimeout: queueConfigs.pdfGeneration.timeout,
        },
    });
}
function createUploadWorker(processor) {
    const config = (0, redis_config_upstash_1.createUpstashWorkerConfig)(queueConfigs.fileUpload.concurrency);
    return new bullmq_1.Worker(queueConfigs.fileUpload.name, processor, {
        ...config,
        settings: {
            ...config.settings,
            jobTimeout: queueConfigs.fileUpload.timeout,
        },
    });
}
async function addEbookJob(jobData, options) {
    const job = await exports.contentQueue.add('generate-ebook-content', jobData, {
        priority: options?.priority || queueConfigs.contentGeneration.priority,
        delay: options?.delay || 0,
        attempts: options?.attempts || 3,
        jobId: `ebook-${jobData.requestId}`,
        metadata: {
            userId: jobData.userId,
            timestamp: Date.now(),
            source: 'api-vercel',
        },
    });
    console.log(`📝 Job de conteúdo adicionado: ${job.id} para usuário ${jobData.userId}`);
    return job.id;
}
async function getJobStatus(jobId) {
    const queues = [exports.contentQueue, exports.pdfQueue, exports.uploadQueue];
    for (const queue of queues) {
        try {
            const job = await queue.getJob(jobId);
            if (job) {
                return {
                    id: job.id,
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
        }
        catch (error) {
            console.warn(`⚠️ Erro ao buscar job ${jobId} na fila ${queue.name}:`, error);
        }
    }
    throw new Error(`Job ${jobId} não encontrado em nenhuma fila`);
}
async function cleanupOldJobs() {
    const queues = [exports.contentQueue, exports.pdfQueue, exports.uploadQueue];
    for (const queue of queues) {
        try {
            await queue.clean(60 * 60 * 1000, 100, 'completed');
            await queue.clean(6 * 60 * 60 * 1000, 50, 'failed');
            console.log(`🧹 Limpeza realizada na fila ${queue.name}`);
        }
        catch (error) {
            console.error(`❌ Erro na limpeza da fila ${queue.name}:`, error);
        }
    }
}
async function getQueueMetrics() {
    const queues = [
        { name: 'content-generation', queue: exports.contentQueue },
        { name: 'pdf-generation', queue: exports.pdfQueue },
        { name: 'file-upload', queue: exports.uploadQueue },
    ];
    const metrics = {};
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
        }
        catch (error) {
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
exports.contentQueue.on('completed', (job) => {
    console.log(`✅ Job de conteúdo completo: ${job.id}`);
});
exports.contentQueue.on('failed', (job, err) => {
    console.error(`❌ Job de conteúdo falhou: ${job?.id}`, err.message);
});
exports.pdfQueue.on('completed', (job) => {
    console.log(`📄 Job de PDF completo: ${job.id}`);
});
exports.pdfQueue.on('failed', (job, err) => {
    console.error(`❌ Job de PDF falhou: ${job?.id}`, err.message);
});
exports.uploadQueue.on('completed', (job) => {
    console.log(`☁️ Job de upload completo: ${job.id}`);
});
exports.uploadQueue.on('failed', (job, err) => {
    console.error(`❌ Job de upload falhou: ${job?.id}`, err.message);
});
setInterval(cleanupOldJobs, 30 * 60 * 1000);
