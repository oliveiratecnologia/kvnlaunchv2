#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorkers = startWorkers;
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '.env.local') });
const bullmq_upstash_config_1 = require("../lib/bullmq-upstash-config");
const redis_config_upstash_1 = require("../lib/redis-config-upstash");
const pdf_generator_1 = require("../lib/pdf-generator");
const supabaseClient_1 = require("../lib/supabaseClient");
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
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
function logWarning(message) {
    log(`⚠️  ${message}`, colors.yellow);
}
async function processContentJob(job) {
    logInfo(`Processando job de conteúdo: ${job.id}`);
    try {
        const { ebookData, userId, requestId } = job.data;
        logInfo(`Gerando estrutura do ebook: ${ebookData.titulo}`);
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
        const estrutura = await (0, pdf_generator_1.generateEbookStructure)(ebookDataFormatted);
        const totalPalavras = estrutura.capitulos.reduce((total, cap) => {
            return total + cap.conteudo.length / 5;
        }, 0);
        const metadata = {
            totalPalavras: Math.round(totalPalavras),
            tempoEstimadoLeitura: Math.ceil(totalPalavras / 200)
        };
        logSuccess(`Conteúdo gerado para ${userId}: ${estrutura.capitulos.length} capítulos, ${metadata.totalPalavras} palavras`);
        return { estrutura, metadata };
    }
    catch (error) {
        logError(`Erro no processamento de conteúdo: ${error}`);
        throw error;
    }
}
async function processPDFJob(job) {
    logInfo(`Processando job de PDF: ${job.id}`);
    try {
        const { estrutura, userId, requestId } = job.data;
        logInfo(`Gerando PDF para: ${estrutura.titulo}`);
        const pdfBuffer = await (0, pdf_generator_1.generateEbookPDF)(estrutura);
        const totalConteudo = estrutura.capitulos.reduce((total, cap) => {
            return total + cap.conteudo.length;
        }, 0);
        const paginasEstimadas = Math.max(1, Math.ceil(totalConteudo / 2500));
        const resultado = {
            pdfBuffer,
            tamanhoArquivo: pdfBuffer.length,
            paginasTotais: paginasEstimadas
        };
        logSuccess(`PDF gerado para ${userId}: ${(resultado.tamanhoArquivo / 1024 / 1024).toFixed(2)} MB, ~${resultado.paginasTotais} páginas`);
        return resultado;
    }
    catch (error) {
        logError(`Erro na geração de PDF: ${error}`);
        throw error;
    }
}
async function processUploadJob(job) {
    logInfo(`Processando job de upload: ${job.id}`);
    try {
        const { pdfBuffer, nomeArquivo, userId, requestId, metadata } = job.data;
        logInfo(`Fazendo upload para Supabase: ${nomeArquivo}`);
        const timestamp = Date.now();
        const fileName = nomeArquivo || `ebook_${requestId}_${timestamp}.pdf`;
        const filePath = `ebooks/${userId}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabaseClient_1.supabase.storage
            .from('ebooks')
            .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
        });
        if (uploadError) {
            logError(`Erro no upload Supabase: ${uploadError.message}`);
            throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
        }
        const { data: urlData } = supabaseClient_1.supabase.storage
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
    }
    catch (error) {
        logError(`Erro no upload: ${error}`);
        throw error;
    }
}
async function createHealthCheckServer() {
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 3001;
    app.use(express.json());
    app.get('/health', async (req, res) => {
        try {
            const redisStatus = await (0, redis_config_upstash_1.verificarConexaoUpstash)();
            const metrics = await (0, bullmq_upstash_config_1.getQueueMetrics)();
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
        }
        catch (error) {
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
async function startWorkers() {
    logInfo('🚀 Iniciando Workers BullMQ - Railway Hybrid Architecture');
    try {
        logInfo('Verificando conexão com Upstash Redis...');
        const redisStatus = await (0, redis_config_upstash_1.verificarConexaoUpstash)();
        if (!redisStatus.connected) {
            throw new Error(`Falha na conexão Redis: ${redisStatus.error}`);
        }
        logSuccess(`Redis conectado - Latência: ${redisStatus.latency}ms`);
        logInfo('Criando workers BullMQ...');
        const contentWorker = (0, bullmq_upstash_config_1.createContentWorker)(processContentJob);
        const pdfWorker = (0, bullmq_upstash_config_1.createPDFWorker)(processPDFJob);
        const uploadWorker = (0, bullmq_upstash_config_1.createUploadWorker)(processUploadJob);
        contentWorker.on('completed', async (job, result) => {
            logSuccess(`Job de conteúdo completo: ${job.id}`);
            try {
                const { pdfQueue } = await Promise.resolve().then(() => __importStar(require('../lib/bullmq-upstash-config')));
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
            }
            catch (error) {
                logError(`Erro ao criar job de PDF: ${error}`);
            }
        });
        contentWorker.on('failed', (job, err) => {
            logError(`Job de conteúdo falhou: ${job?.id} - ${err.message}`);
        });
        pdfWorker.on('completed', async (job, result) => {
            logSuccess(`Job de PDF completo: ${job.id}`);
            try {
                const { uploadQueue } = await Promise.resolve().then(() => __importStar(require('../lib/bullmq-upstash-config')));
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
            }
            catch (error) {
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
        await createHealthCheckServer();
        setInterval(async () => {
            try {
                await (0, bullmq_upstash_config_1.cleanupOldJobs)();
                logInfo('Limpeza automática de jobs antigos executada');
            }
            catch (error) {
                logWarning(`Erro na limpeza automática: ${error}`);
            }
        }, 30 * 60 * 1000);
        setInterval(async () => {
            try {
                const metrics = await (0, bullmq_upstash_config_1.getQueueMetrics)();
                logInfo('📊 Métricas das filas:');
                Object.entries(metrics).forEach(([nome, stats]) => {
                    logInfo(`   ${nome}: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
                });
            }
            catch (error) {
                logWarning(`Erro ao obter métricas: ${error}`);
            }
        }, 5 * 60 * 1000);
        logInfo('🎯 Workers prontos para processar jobs!');
    }
    catch (error) {
        logError(`Erro fatal ao iniciar workers: ${error}`);
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    logInfo('🛑 Recebido SIGTERM, encerrando workers...');
    await redis_config_upstash_1.upstashRedisConnection.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logInfo('🛑 Recebido SIGINT, encerrando workers...');
    await redis_config_upstash_1.upstashRedisConnection.disconnect();
    process.exit(0);
});
if (require.main === module) {
    startWorkers().catch((error) => {
        logError(`Erro fatal: ${error}`);
        process.exit(1);
    });
}
