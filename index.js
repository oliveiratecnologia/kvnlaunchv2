#!/usr/bin/env node

console.log('🚀 Railway API - Iniciando...');

const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'railway-api',
      port: port
    }));
    return;
  }
  
  if (req.url === '/' || req.url === '/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'Railway API funcionando!',
      timestamp: new Date().toISOString(),
      endpoints: ['/health', '/test']
    }));
    return;
  }
  
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});

server.on('error', (err) => {
  console.error('❌ Erro no servidor:', err);
  process.exit(1);
});

console.log('🎯 Processo ativo');
