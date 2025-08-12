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
exports.upstashBullMQConfig = exports.upstashRedisPool = exports.UpstashRedisConnectionPool = exports.upstashRedisConnection = void 0;
exports.verificarConexaoUpstash = verificarConexaoUpstash;
exports.createUpstashWorkerConfig = createUpstashWorkerConfig;
const ioredis_1 = require("ioredis");
const url_1 = require("url");
const dotenv = __importStar(require("dotenv"));
const path_1 = require("path");
dotenv.config({ path: (0, path_1.resolve)(process.cwd(), '.env.local') });
function parseUpstashRedisUrl(redisUrl) {
    const url = new url_1.URL(redisUrl);
    return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        username: url.username || 'default',
        password: url.password,
        protocol: url.protocol,
    };
}
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL || '';
const parsedUrl = parseUpstashRedisUrl(REDIS_URL);
console.log(`🔗 Configurando conexão Upstash Redis: ${parsedUrl.host}:${parsedUrl.port}`);
const upstashRedisConfig = {
    host: parsedUrl.host,
    port: parsedUrl.port,
    username: parsedUrl.username,
    password: parsedUrl.password,
    tls: {
        rejectUnauthorized: true,
        servername: parsedUrl.host,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
    },
    connectTimeout: 10000,
    commandTimeout: 8000,
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 200,
    maxLoadingTimeout: 8000,
    keepAlive: 30000,
    family: 4,
    db: 0,
    reconnectOnError: (err) => {
        console.log('🔄 Tentando reconectar ao Upstash Redis:', err.message);
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
        return targetErrors.some(target => err.message.includes(target));
    },
    retryStrategy: (times) => {
        if (times > 3) {
            console.error(`❌ Falha na conexão Upstash após ${times} tentativas`);
            return null;
        }
        const delay = Math.min(times * 100, 3000);
        console.log(`🔄 Retry Upstash tentativa ${times}, aguardando ${delay}ms`);
        return delay;
    },
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectionName: 'upstash-bullmq-connection',
};
exports.upstashRedisConnection = new ioredis_1.Redis(upstashRedisConfig);
class UpstashRedisConnectionPool {
    constructor() {
        this.connections = [];
        this.maxConnections = 6;
        this.currentIndex = 0;
        console.log(`🏊 Criando pool de ${this.maxConnections} conexões Upstash Redis`);
        for (let i = 0; i < this.maxConnections; i++) {
            const connection = new ioredis_1.Redis({
                ...upstashRedisConfig,
                connectionName: `upstash-pool-${i}`,
            });
            connection.on('error', (err) => {
                console.error(`❌ Erro na conexão pool-${i}:`, err.message);
            });
            this.connections.push(connection);
        }
    }
    getConnection() {
        const connection = this.connections[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.maxConnections;
        return connection;
    }
    async closeAll() {
        console.log('🔌 Fechando todas as conexões do pool Upstash');
        await Promise.all(this.connections.map((conn, index) => {
            console.log(`   Fechando conexão pool-${index}`);
            return conn.disconnect();
        }));
    }
    async healthCheck() {
        let healthy = 0;
        for (let i = 0; i < this.connections.length; i++) {
            try {
                await this.connections[i].ping();
                healthy++;
            }
            catch (error) {
                console.warn(`⚠️ Conexão pool-${i} não está saudável:`, error);
            }
        }
        return { healthy, total: this.connections.length };
    }
}
exports.UpstashRedisConnectionPool = UpstashRedisConnectionPool;
exports.upstashRedisPool = new UpstashRedisConnectionPool();
async function verificarConexaoUpstash() {
    try {
        const start = Date.now();
        const pong = await exports.upstashRedisConnection.ping();
        const latency = Date.now() - start;
        if (pong !== 'PONG') {
            throw new Error(`Resposta inesperada do ping: ${pong}`);
        }
        const serverInfo = await exports.upstashRedisConnection.info('server');
        const serverVersion = serverInfo.split('\n').find(line => line.startsWith('redis_version:'));
        console.log(`✅ Upstash Redis conectado - Latência: ${latency}ms`);
        console.log(`📊 Servidor: ${serverVersion || 'Versão não identificada'}`);
        return {
            connected: true,
            latency,
            serverInfo: serverVersion || 'Unknown',
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('❌ Erro na conexão Upstash Redis:', errorMessage);
        return {
            connected: false,
            latency: -1,
            error: errorMessage,
        };
    }
}
exports.upstashRedisConnection.on('connect', () => {
    console.log('🔗 Conectado ao Upstash Redis');
});
exports.upstashRedisConnection.on('ready', () => {
    console.log('✅ Upstash Redis pronto para uso');
});
exports.upstashRedisConnection.on('error', (err) => {
    console.error('❌ Erro Upstash Redis:', err.message);
});
exports.upstashRedisConnection.on('close', () => {
    console.log('🔌 Conexão Upstash Redis fechada');
});
exports.upstashRedisConnection.on('reconnecting', () => {
    console.log('🔄 Reconectando ao Upstash Redis...');
});
exports.upstashBullMQConfig = {
    connection: exports.upstashRedisConnection,
    settings: {
        stalledInterval: 60000,
        maxStalledCount: 1,
        retryProcessDelay: 5000,
    },
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        ttl: 24 * 60 * 60 * 1000,
    },
};
function createUpstashWorkerConfig(concurrency = 3) {
    return {
        ...exports.upstashBullMQConfig,
        concurrency,
        settings: {
            ...exports.upstashBullMQConfig.settings,
        },
    };
}
process.on('SIGTERM', async () => {
    console.log('🛑 Recebido SIGTERM, fechando conexões Upstash Redis...');
    await exports.upstashRedisPool.closeAll();
    await exports.upstashRedisConnection.disconnect();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('🛑 Recebido SIGINT, fechando conexões Upstash Redis...');
    await exports.upstashRedisPool.closeAll();
    await exports.upstashRedisConnection.disconnect();
    process.exit(0);
});
