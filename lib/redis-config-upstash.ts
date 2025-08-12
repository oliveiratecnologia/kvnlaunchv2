// lib/redis-config-upstash.ts
import { Redis, RedisOptions } from 'ioredis';
import { URL } from 'url';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Parse da REDIS_URL fornecida
function parseUpstashRedisUrl(redisUrl: string) {
  const url = new URL(redisUrl);
  
  return {
    host: url.hostname, // integral-katydid-16901.upstash.io
    port: parseInt(url.port) || 6379,
    username: url.username || 'default',
    password: url.password, // AUIFAAIjcDEwZmQwMmQ1NDBkMGU0ZjU0YmI3ZDFlNWQ3Yzg4YjMxZHAxMA
    protocol: url.protocol, // rediss:
  };
}

// Configurações da conexão Upstash Redis
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL || '';
const parsedUrl = parseUpstashRedisUrl(REDIS_URL);

console.log(`🔗 Configurando conexão Upstash Redis: ${parsedUrl.host}:${parsedUrl.port}`);

// Configurações otimizadas para Upstash Redis + BullMQ
const upstashRedisConfig: RedisOptions = {
  host: parsedUrl.host,
  port: parsedUrl.port,
  username: parsedUrl.username,
  password: parsedUrl.password,
  
  // TLS obrigatório no Upstash (protocolo rediss://)
  tls: {
    rejectUnauthorized: true,
    servername: parsedUrl.host,
    // Configurações específicas para Upstash
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
  },
  
  // Configurações de timeout otimizadas para Upstash
  connectTimeout: 10000, // 10 segundos
  commandTimeout: 8000,  // 8 segundos (Upstash tem timeout mais restritivo)
  lazyConnect: false, // Conectar imediatamente
  
  // Pool de conexões otimizado para Upstash
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 200,
  maxLoadingTimeout: 8000,
  
  // Keep-alive para conexão externa
  keepAlive: 30000,
  family: 4,
  
  // Database sempre 0 no Upstash
  db: 0,
  
  // Configurações de reconexão para Upstash
  reconnectOnError: (err) => {
    console.log('🔄 Tentando reconectar ao Upstash Redis:', err.message);
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
    return targetErrors.some(target => err.message.includes(target));
  },
  
  // Retry strategy adaptado para Upstash (mais conservador)
  retryStrategy: (times) => {
    if (times > 3) {
      console.error(`❌ Falha na conexão Upstash após ${times} tentativas`);
      return null; // Para de tentar
    }
    const delay = Math.min(times * 100, 3000);
    console.log(`🔄 Retry Upstash tentativa ${times}, aguardando ${delay}ms`);
    return delay;
  },
  
  // Configurações de performance
  enableReadyCheck: true,
  enableOfflineQueue: true, // Permitir enfileiramento offline para conexão inicial
  
  // Nome da conexão para debugging
  connectionName: 'upstash-bullmq-connection',
};

// Instância principal do Redis Upstash
export const upstashRedisConnection = new Redis(upstashRedisConfig);

// Pool de conexões adaptado para Upstash (menor que Redis Cloud)
export class UpstashRedisConnectionPool {
  private connections: Redis[] = [];
  private maxConnections = 6; // Conservador para Upstash
  private currentIndex = 0;

  constructor() {
    console.log(`🏊 Criando pool de ${this.maxConnections} conexões Upstash Redis`);
    
    for (let i = 0; i < this.maxConnections; i++) {
      const connection = new Redis({
        ...upstashRedisConfig,
        connectionName: `upstash-pool-${i}`,
      });
      
      // Event listeners para cada conexão do pool
      connection.on('error', (err) => {
        console.error(`❌ Erro na conexão pool-${i}:`, err.message);
      });
      
      this.connections.push(connection);
    }
  }

  // Obter conexão do pool (round-robin)
  getConnection(): Redis {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.maxConnections;
    return connection;
  }

  // Fechar todas as conexões do pool
  async closeAll(): Promise<void> {
    console.log('🔌 Fechando todas as conexões do pool Upstash');
    await Promise.all(
      this.connections.map((conn, index) => {
        console.log(`   Fechando conexão pool-${index}`);
        return conn.disconnect();
      })
    );
  }

  // Verificar saúde do pool
  async healthCheck(): Promise<{ healthy: number; total: number }> {
    let healthy = 0;
    
    for (let i = 0; i < this.connections.length; i++) {
      try {
        await this.connections[i].ping();
        healthy++;
      } catch (error) {
        console.warn(`⚠️ Conexão pool-${i} não está saudável:`, error);
      }
    }
    
    return { healthy, total: this.connections.length };
  }
}

// Instância do pool para workers
export const upstashRedisPool = new UpstashRedisConnectionPool();

// Health check específico para Upstash
export async function verificarConexaoUpstash(): Promise<{
  connected: boolean;
  latency: number;
  serverInfo?: string;
  error?: string;
}> {
  try {
    const start = Date.now();
    const pong = await upstashRedisConnection.ping();
    const latency = Date.now() - start;
    
    if (pong !== 'PONG') {
      throw new Error(`Resposta inesperada do ping: ${pong}`);
    }
    
    // Obter informações do servidor Upstash
    const serverInfo = await upstashRedisConnection.info('server');
    const serverVersion = serverInfo.split('\n').find(line => line.startsWith('redis_version:'));
    
    console.log(`✅ Upstash Redis conectado - Latência: ${latency}ms`);
    console.log(`📊 Servidor: ${serverVersion || 'Versão não identificada'}`);
    
    return {
      connected: true,
      latency,
      serverInfo: serverVersion || 'Unknown',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro na conexão Upstash Redis:', errorMessage);
    
    return {
      connected: false,
      latency: -1,
      error: errorMessage,
    };
  }
}

// Monitoramento de eventos da conexão principal
upstashRedisConnection.on('connect', () => {
  console.log('🔗 Conectado ao Upstash Redis');
});

upstashRedisConnection.on('ready', () => {
  console.log('✅ Upstash Redis pronto para uso');
});

upstashRedisConnection.on('error', (err) => {
  console.error('❌ Erro Upstash Redis:', err.message);
});

upstashRedisConnection.on('close', () => {
  console.log('🔌 Conexão Upstash Redis fechada');
});

upstashRedisConnection.on('reconnecting', () => {
  console.log('🔄 Reconectando ao Upstash Redis...');
});

// Configurações específicas para BullMQ com Upstash
export const upstashBullMQConfig = {
  connection: upstashRedisConnection,
  
  // Configurações otimizadas para Upstash + BullMQ
  settings: {
    stalledInterval: 60000,     // 1 minuto (reduzir polling para economizar requests)
    maxStalledCount: 1,         // Menos tentativas para evitar loops
    retryProcessDelay: 5000,    // 5 segundos entre tentativas
  },
  
  // Configurações de job padrão otimizadas para Upstash
  defaultJobOptions: {
    removeOnComplete: 10,  // Manter apenas 10 jobs completos (economizar memória)
    removeOnFail: 5,       // Manter apenas 5 jobs falhados
    attempts: 3,           // Máximo 3 tentativas
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    // TTL para jobs (24 horas)
    ttl: 24 * 60 * 60 * 1000,
  },
};

// Função para criar configuração de worker otimizada
export function createUpstashWorkerConfig(concurrency: number = 3) {
  return {
    ...upstashBullMQConfig,
    concurrency, // Concorrência ajustável
    
    // Configurações específicas do worker
    settings: {
      ...upstashBullMQConfig.settings,
      // Configurações adicionais podem ser adicionadas aqui
    },
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, fechando conexões Upstash Redis...');
  await upstashRedisPool.closeAll();
  await upstashRedisConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, fechando conexões Upstash Redis...');
  await upstashRedisPool.closeAll();
  await upstashRedisConnection.disconnect();
  process.exit(0);
});
