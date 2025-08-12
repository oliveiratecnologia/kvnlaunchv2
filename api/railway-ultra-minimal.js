#!/usr/bin/env node

// Log inicial
console.log('=== RAILWAY ULTRA MINIMAL API ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);

// Verificar variáveis de ambiente
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const http = require('http');
const url = require('url');

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

console.log(`Configurando servidor HTTP na porta ${port}, host ${host}`);

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/health') {
    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ultra-minimal-api',
      port: port,
      host: host,
      method: req.method,
      url: req.url,
      headers: req.headers,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  if (path === '/' || path === '/test') {
    const response = {
      message: 'Railway Ultra Minimal API funcionando!',
      timestamp: new Date().toISOString(),
      endpoints: ['/health', '/test', '/'],
      server: {
        port: port,
        host: host,
        uptime: process.uptime()
      }
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    return;
  }
  
  // 404 para outras rotas
  res.writeHead(404);
  res.end(JSON.stringify({
    error: 'Not Found',
    path: path,
    timestamp: new Date().toISOString()
  }));
});

// Error handler
server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

// Iniciar servidor
console.log(`Tentando iniciar servidor HTTP...`);
server.listen(port, host, () => {
  console.log(`✅ Servidor HTTP rodando em ${host}:${port}`);
  console.log(`🌍 Endpoints disponíveis:`);
  console.log(`   - GET http://${host}:${port}/health`);
  console.log(`   - GET http://${host}:${port}/test`);
  console.log(`   - GET http://${host}:${port}/`);
  console.log('🎯 Servidor pronto para receber requisições');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor HTTP encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando servidor...');
  server.close(() => {
    console.log('Servidor HTTP encerrado');
    process.exit(0);
  });
});

// Capturar erros não tratados
process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
  console.error('Stack trace:', err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Heartbeat
setInterval(() => {
  console.log(`💓 Heartbeat - ${new Date().toISOString()} - Uptime: ${Math.round(process.uptime())}s`);
}, 30000);

console.log('🚀 Processo iniciado, aguardando conexões...');
