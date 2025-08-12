#!/usr/bin/env node
// scripts/test-redis-connection.js
// Teste de conectividade com DigitalOcean Redis Valkey

const Redis = require('ioredis');

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

async function testRedisConnection() {
  const redisUrl = 'rediss://default:AVNS_lYle9myZMLH1ZazBhlS@ebook-redis-valkey-do-user-24250021-0.m.db.ondigitalocean.com:25061';
  
  log('🚀 Iniciando teste de conectividade Redis DigitalOcean...', colors.blue);
  log(`📡 URL: ${redisUrl.replace(/:[^:]*@/, ':***@')}`, colors.blue);
  
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    connectTimeout: 10000,
    commandTimeout: 8000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  
  try {
    // Teste 1: Conectar
    log('🔌 Testando conexão...', colors.yellow);
    await redis.connect();
    log('✅ Conexão estabelecida com sucesso!', colors.green);
    
    // Teste 2: Ping
    log('🏓 Testando comando PING...', colors.yellow);
    const pong = await redis.ping();
    log(`✅ PING respondeu: ${pong}`, colors.green);
    
    // Teste 3: Set/Get
    log('💾 Testando comandos SET/GET...', colors.yellow);
    const testKey = `test:${Date.now()}`;
    const testValue = 'DigitalOcean Redis funcionando!';
    
    await redis.set(testKey, testValue);
    const retrievedValue = await redis.get(testKey);
    
    if (retrievedValue === testValue) {
      log('✅ SET/GET funcionando corretamente!', colors.green);
    } else {
      throw new Error(`Valor recuperado não confere: esperado "${testValue}", recebido "${retrievedValue}"`);
    }
    
    // Teste 4: Expiração
    log('⏰ Testando TTL (expiração)...', colors.yellow);
    await redis.setex(`ttl:${Date.now()}`, 5, 'valor temporário');
    log('✅ TTL configurado com sucesso!', colors.green);
    
    // Teste 5: Listas (para BullMQ)
    log('📋 Testando operações de lista (BullMQ)...', colors.yellow);
    const listKey = `list:test:${Date.now()}`;
    
    await redis.lpush(listKey, 'item1', 'item2', 'item3');
    const listLength = await redis.llen(listKey);
    const items = await redis.lrange(listKey, 0, -1);
    
    log(`✅ Lista criada com ${listLength} itens: ${items.join(', ')}`, colors.green);
    
    // Teste 6: Hash (para metadados)
    log('🗂️  Testando operações de hash...', colors.yellow);
    const hashKey = `hash:test:${Date.now()}`;
    
    await redis.hset(hashKey, {
      'job_id': 'test-123',
      'status': 'completed',
      'created_at': new Date().toISOString()
    });
    
    const hashData = await redis.hgetall(hashKey);
    log(`✅ Hash criado: ${JSON.stringify(hashData)}`, colors.green);
    
    // Teste 7: Pub/Sub (para eventos)
    log('📢 Testando Pub/Sub...', colors.yellow);
    const subscriber = redis.duplicate();
    
    await subscriber.subscribe('test-channel');
    
    subscriber.on('message', (channel, message) => {
      log(`✅ Mensagem recebida no canal ${channel}: ${message}`, colors.green);
    });
    
    await redis.publish('test-channel', 'Teste de mensagem!');
    
    // Aguardar um pouco para a mensagem ser processada
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await subscriber.unsubscribe('test-channel');
    await subscriber.disconnect();
    
    // Limpeza
    log('🧹 Limpando dados de teste...', colors.yellow);
    await redis.del(testKey, listKey, hashKey);
    
    // Informações do servidor
    log('📊 Obtendo informações do servidor...', colors.yellow);
    const info = await redis.info('server');
    const serverInfo = info.split('\r\n').filter(line => 
      line.includes('redis_version') || 
      line.includes('used_memory_human') ||
      line.includes('connected_clients')
    );
    
    serverInfo.forEach(line => {
      if (line.trim()) {
        log(`📈 ${line}`, colors.blue);
      }
    });
    
    log('🎉 Todos os testes passaram! Redis DigitalOcean está funcionando perfeitamente!', colors.green);
    
  } catch (error) {
    log(`❌ Erro no teste: ${error.message}`, colors.red);
    
    if (error.code === 'ENOTFOUND') {
      log('💡 Dica: Verifique se o cluster Redis foi criado completamente', colors.yellow);
    } else if (error.code === 'ECONNREFUSED') {
      log('💡 Dica: Verifique as configurações de firewall e rede', colors.yellow);
    } else if (error.message.includes('WRONGPASS')) {
      log('💡 Dica: Verifique as credenciais de autenticação', colors.yellow);
    }
    
    process.exit(1);
  } finally {
    await redis.disconnect();
    log('🔌 Conexão encerrada', colors.blue);
  }
}

// Executar teste
if (require.main === module) {
  testRedisConnection().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { testRedisConnection };
