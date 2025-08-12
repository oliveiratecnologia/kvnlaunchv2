#!/usr/bin/env tsx
// scripts/testar-upstash-conexao.ts

import { 
  upstashRedisConnection, 
  upstashRedisPool, 
  verificarConexaoUpstash 
} from '../lib/redis-config-upstash';
import { 
  contentQueue, 
  pdfQueue, 
  uploadQueue, 
  getQueueMetrics,
  addEbookJob 
} from '../lib/bullmq-upstash-config';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string, message: string) {
  log(`${step} ${message}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testarConexaoBasica(): Promise<boolean> {
  logStep('1️⃣', 'Testando conexão básica com Upstash Redis...');
  
  try {
    const resultado = await verificarConexaoUpstash();
    
    if (resultado.connected) {
      logSuccess(`Conexão estabelecida com sucesso!`);
      log(`   📊 Latência: ${resultado.latency}ms`);
      log(`   🖥️  Servidor: ${resultado.serverInfo}`);
      
      if (resultado.latency > 200) {
        logWarning(`Latência alta detectada (${resultado.latency}ms > 200ms)`);
      }
      
      return true;
    } else {
      logError(`Falha na conexão: ${resultado.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro inesperado: ${error}`);
    return false;
  }
}

async function testarOperacoesBasicas(): Promise<boolean> {
  logStep('2️⃣', 'Testando operações básicas SET/GET...');
  
  try {
    const chaveTest = 'teste:upstash:conexao';
    const valorTest = `funcionando-${Date.now()}`;
    
    // Teste SET
    await upstashRedisConnection.set(chaveTest, valorTest);
    logSuccess('Operação SET executada com sucesso');
    
    // Teste GET
    const valorRecuperado = await upstashRedisConnection.get(chaveTest);
    
    if (valorRecuperado === valorTest) {
      logSuccess('Operação GET executada com sucesso');
      
      // Limpeza
      await upstashRedisConnection.del(chaveTest);
      logSuccess('Limpeza realizada');
      
      return true;
    } else {
      logError(`Valor recuperado não confere: esperado "${valorTest}", recebido "${valorRecuperado}"`);
      return false;
    }
  } catch (error) {
    logError(`Erro nas operações básicas: ${error}`);
    return false;
  }
}

async function testarThroughput(): Promise<{ throughput: number; success: boolean }> {
  logStep('3️⃣', 'Testando throughput para BullMQ...');
  
  try {
    const numOperacoes = 50;
    const startTime = Date.now();
    
    // Criar operações SET em paralelo
    const operacoes = Array.from({ length: numOperacoes }, (_, i) =>
      upstashRedisConnection.set(`teste:throughput:${i}`, `valor${i}`)
    );
    
    await Promise.all(operacoes);
    const endTime = Date.now();
    
    const tempoTotal = (endTime - startTime) / 1000; // em segundos
    const throughput = numOperacoes / tempoTotal;
    
    logSuccess(`Throughput medido: ${throughput.toFixed(2)} ops/sec`);
    log(`   ⏱️  Tempo total: ${tempoTotal.toFixed(2)}s para ${numOperacoes} operações`);
    
    // Limpeza
    const limpeza = Array.from({ length: numOperacoes }, (_, i) =>
      upstashRedisConnection.del(`teste:throughput:${i}`)
    );
    await Promise.all(limpeza);
    
    // Avaliar performance
    if (throughput < 10) {
      logWarning(`Throughput baixo (${throughput.toFixed(2)} < 10 ops/sec)`);
    } else if (throughput > 50) {
      logSuccess(`Throughput excelente (${throughput.toFixed(2)} > 50 ops/sec)`);
    }
    
    return { throughput, success: true };
  } catch (error) {
    logError(`Erro no teste de throughput: ${error}`);
    return { throughput: 0, success: false };
  }
}

async function testarComandosBullMQ(): Promise<boolean> {
  logStep('4️⃣', 'Testando comandos específicos do BullMQ...');
  
  try {
    const filaTest = 'teste:bullmq:queue';
    
    // Teste LPUSH (usado pelo BullMQ)
    await upstashRedisConnection.lpush(filaTest, 'job1', 'job2', 'job3');
    logSuccess('Comando LPUSH executado');
    
    // Teste LLEN
    const tamanhoFila = await upstashRedisConnection.llen(filaTest);
    log(`   📏 Tamanho da fila: ${tamanhoFila}`);
    
    if (tamanhoFila !== 3) {
      logWarning(`Tamanho esperado: 3, obtido: ${tamanhoFila}`);
    }
    
    // Teste BRPOP (usado pelo BullMQ para polling)
    const resultado = await upstashRedisConnection.brpop(filaTest, 1);
    if (resultado) {
      logSuccess(`Comando BRPOP executado: ${resultado[1]}`);
    }
    
    // Teste HSET/HGET (usado para metadata dos jobs)
    const hashTest = 'teste:bullmq:job:1';
    await upstashRedisConnection.hset(hashTest, {
      status: 'active',
      data: JSON.stringify({ teste: true }),
      timestamp: Date.now().toString(),
    });
    logSuccess('Comando HSET executado');
    
    const status = await upstashRedisConnection.hget(hashTest, 'status');
    if (status === 'active') {
      logSuccess('Comando HGET executado');
    }
    
    // Limpeza
    await upstashRedisConnection.del(filaTest, hashTest);
    logSuccess('Limpeza dos testes BullMQ realizada');
    
    return true;
  } catch (error) {
    logError(`Erro nos comandos BullMQ: ${error}`);
    return false;
  }
}

async function testarPoolConexoes(): Promise<boolean> {
  logStep('5️⃣', 'Testando pool de conexões...');
  
  try {
    const healthCheck = await upstashRedisPool.healthCheck();
    
    log(`   🏊 Pool: ${healthCheck.healthy}/${healthCheck.total} conexões saudáveis`);
    
    if (healthCheck.healthy === healthCheck.total) {
      logSuccess('Todas as conexões do pool estão saudáveis');
      return true;
    } else if (healthCheck.healthy > 0) {
      logWarning(`Apenas ${healthCheck.healthy}/${healthCheck.total} conexões saudáveis`);
      return true; // Ainda funcional
    } else {
      logError('Nenhuma conexão do pool está saudável');
      return false;
    }
  } catch (error) {
    logError(`Erro no teste do pool: ${error}`);
    return false;
  }
}

async function testarFilasBullMQ(): Promise<boolean> {
  logStep('6️⃣', 'Testando filas BullMQ...');
  
  try {
    // Obter métricas iniciais
    const metricas = await getQueueMetrics();
    
    log('   📊 Métricas das filas:');
    Object.entries(metricas).forEach(([nome, stats]) => {
      log(`     ${nome}: waiting=${stats.waiting}, active=${stats.active}, completed=${stats.completed}, failed=${stats.failed}`);
    });
    
    // Teste de adição de job
    const jobData = {
      userId: 'test-user',
      ebookData: {
        titulo: 'Teste de Conectividade',
        categoria: 'Tecnologia',
        numeroCapitulos: 3,
        detalhesAdicionais: 'Teste automatizado de conexão Upstash',
      },
      requestId: `test-${Date.now()}`,
      timestamp: Date.now(),
    };
    
    const jobId = await addEbookJob(jobData);
    logSuccess(`Job de teste adicionado: ${jobId}`);
    
    // Aguardar um pouco e verificar se o job foi adicionado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const metricasApos = await getQueueMetrics();
    const filaContent = metricasApos['content-generation'];
    
    if (filaContent.waiting > 0 || filaContent.active > 0) {
      logSuccess('Job aparece na fila (waiting ou active)');
    } else {
      logWarning('Job não encontrado na fila (pode ter sido processado rapidamente)');
    }
    
    // Limpar job de teste
    try {
      const job = await contentQueue.getJob(jobId);
      if (job) {
        await job.remove();
        logSuccess('Job de teste removido');
      }
    } catch (error) {
      logWarning(`Não foi possível remover job de teste: ${error}`);
    }
    
    return true;
  } catch (error) {
    logError(`Erro no teste das filas BullMQ: ${error}`);
    return false;
  }
}

async function testarLatenciaDetalhada(): Promise<void> {
  logStep('7️⃣', 'Testando latência detalhada...');
  
  const numTestes = 10;
  const latencias: number[] = [];
  
  for (let i = 0; i < numTestes; i++) {
    try {
      const start = Date.now();
      await upstashRedisConnection.ping();
      const latencia = Date.now() - start;
      latencias.push(latencia);
    } catch (error) {
      logWarning(`Falha no teste ${i + 1}: ${error}`);
    }
  }
  
  if (latencias.length > 0) {
    const latenciaMedia = latencias.reduce((a, b) => a + b, 0) / latencias.length;
    const latenciaMin = Math.min(...latencias);
    const latenciaMax = Math.max(...latencias);
    
    log(`   📊 Latência (${latencias.length} testes):`);
    log(`     Média: ${latenciaMedia.toFixed(2)}ms`);
    log(`     Mínima: ${latenciaMin}ms`);
    log(`     Máxima: ${latenciaMax}ms`);
    
    if (latenciaMedia < 100) {
      logSuccess('Latência excelente (<100ms)');
    } else if (latenciaMedia < 200) {
      logSuccess('Latência boa (<200ms)');
    } else {
      logWarning(`Latência alta (${latenciaMedia.toFixed(2)}ms)`);
    }
  }
}

async function executarTodosOsTestes(): Promise<void> {
  log('\n🧪 INICIANDO TESTES DE CONECTIVIDADE UPSTASH REDIS\n', colors.bright);
  
  const resultados: { [teste: string]: boolean } = {};
  let throughputResult = { throughput: 0, success: false };
  
  try {
    // Executar todos os testes
    resultados.conexaoBasica = await testarConexaoBasica();
    resultados.operacoesBasicas = await testarOperacoesBasicas();
    
    throughputResult = await testarThroughput();
    resultados.throughput = throughputResult.success;
    
    resultados.comandosBullMQ = await testarComandosBullMQ();
    resultados.poolConexoes = await testarPoolConexoes();
    resultados.filasBullMQ = await testarFilasBullMQ();
    
    await testarLatenciaDetalhada();
    
    // Resumo dos resultados
    log('\n📋 RESUMO DOS TESTES:', colors.bright);
    
    let testesPassaram = 0;
    const totalTestes = Object.keys(resultados).length;
    
    Object.entries(resultados).forEach(([teste, passou]) => {
      if (passou) {
        logSuccess(`${teste}: PASSOU`);
        testesPassaram++;
      } else {
        logError(`${teste}: FALHOU`);
      }
    });
    
    log(`\n📊 RESULTADO FINAL: ${testesPassaram}/${totalTestes} testes passaram`, colors.bright);
    
    if (throughputResult.success) {
      log(`⚡ Throughput medido: ${throughputResult.throughput.toFixed(2)} ops/sec`);
    }
    
    if (testesPassaram === totalTestes) {
      logSuccess('\n🎉 TODOS OS TESTES PASSARAM! Upstash Redis está pronto para BullMQ.');
    } else {
      logError(`\n❌ ${totalTestes - testesPassaram} teste(s) falharam. Verifique a configuração.`);
      process.exit(1);
    }
    
  } catch (error) {
    logError(`\nErro inesperado durante os testes: ${error}`);
    process.exit(1);
  } finally {
    // Cleanup
    try {
      await upstashRedisPool.closeAll();
      await upstashRedisConnection.disconnect();
      log('\n🔌 Conexões fechadas com sucesso');
    } catch (error) {
      logWarning(`Erro ao fechar conexões: ${error}`);
    }
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  executarTodosOsTestes().catch((error) => {
    logError(`Erro fatal: ${error}`);
    process.exit(1);
  });
}

export { executarTodosOsTestes };
