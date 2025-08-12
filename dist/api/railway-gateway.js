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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '.env.local') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bullmq_upstash_config_1 = require("../lib/bullmq-upstash-config");
const redis_config_upstash_1 = require("../lib/redis-config-upstash");
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 3000;
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
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
app.get('/health', async (req, res) => {
    try {
        const redisStatus = await (0, redis_config_upstash_1.verificarConexaoUpstash)();
        const metrics = await (0, bullmq_upstash_config_1.getQueueMetrics)();
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
        log(`Health check: ${redisStatus.connected ? 'OK' : 'FAIL'}`, redisStatus.connected ? colors.green : colors.red);
    }
    catch (error) {
        log(`Erro no health check: ${error}`, colors.red);
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
app.post('/api/ebooks/generate', authenticateAPI, async (req, res) => {
    try {
        const { userId, ebookData } = req.body;
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
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const jobData = {
            userId,
            ebookData,
            requestId,
            timestamp: Date.now()
        };
        const jobId = await (0, bullmq_upstash_config_1.addEbookJob)(jobData);
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
    }
    catch (error) {
        log(`Erro ao criar job: ${error}`, colors.red);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erro interno do servidor'
        });
    }
});
app.get('/api/ebooks/status/:jobId', authenticateAPI, async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'jobId é obrigatório'
            });
        }
        const jobStatus = await (0, bullmq_upstash_config_1.getJobStatus)(jobId);
        log(`Status consultado para job: ${jobId} - ${jobStatus.status}`, colors.blue);
        res.json({
            success: true,
            data: jobStatus
        });
    }
    catch (error) {
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
app.get('/api/metrics', authenticateAPI, async (req, res) => {
    try {
        const metrics = await (0, bullmq_upstash_config_1.getQueueMetrics)();
        res.json({
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                queues: metrics
            }
        });
        log('Métricas consultadas', colors.blue);
    }
    catch (error) {
        log(`Erro ao obter métricas: ${error}`, colors.red);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Erro interno do servidor'
        });
    }
});
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Gateway funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use((error, req, res, next) => {
    log(`Erro não tratado: ${error.message}`, colors.red);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'Endpoint não encontrado'
    });
});
async function startServer() {
    try {
        log('Verificando conexão com Upstash Redis...', colors.blue);
        const redisStatus = await (0, redis_config_upstash_1.verificarConexaoUpstash)();
        if (!redisStatus.connected) {
            throw new Error(`Falha na conexão Redis: ${redisStatus.error}`);
        }
        log(`Redis conectado - Latência: ${redisStatus.latency}ms`, colors.green);
        app.listen(port, () => {
            log(`🚀 API Gateway rodando na porta ${port}`, colors.green);
            log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
            log(`🔗 Health check: http://localhost:${port}/health`, colors.blue);
            log(`📊 Métricas: http://localhost:${port}/api/metrics`, colors.blue);
        });
    }
    catch (error) {
        log(`Erro fatal ao iniciar servidor: ${error}`, colors.red);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    log('🛑 Recebido SIGTERM, encerrando servidor...', colors.yellow);
    process.exit(0);
});
process.on('SIGINT', () => {
    log('🛑 Recebido SIGINT, encerrando servidor...', colors.yellow);
    process.exit(0);
});
if (require.main === module) {
    startServer().catch((error) => {
        log(`Erro fatal: ${error}`, colors.red);
        process.exit(1);
    });
}
