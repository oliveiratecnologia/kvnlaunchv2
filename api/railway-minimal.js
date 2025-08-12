#!/usr/bin/env node
// api/railway-minimal.js
// Versão mínima para debug no Railway

console.log('🚀 Iniciando servidor mínimo...');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('PORT configurada:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware básico
app.use(express.json());

// Health check super simples
app.get('/health', (req, res) => {
  console.log('Health check chamado');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'minimal-api',
    port: port,
    env: process.env.NODE_ENV || 'unknown'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint chamado');
  res.json({
    message: 'API Railway Mínima funcionando!',
    timestamp: new Date().toISOString(),
    endpoints: ['/health', '/test']
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint chamado');
  res.json({
    success: true,
    message: 'Teste OK',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro capturado:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// Iniciar servidor
console.log('Tentando iniciar servidor na porta', port);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor mínimo rodando na porta ${port}`);
  console.log(`🌍 Endpoints disponíveis:`);
  console.log(`   - GET /health`);
  console.log(`   - GET /test`);
  console.log(`   - GET /`);
}).on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

// Log de processo ativo
console.log('🎯 Processo ativo, aguardando conexões...');

// Heartbeat para manter o processo vivo
setInterval(() => {
  console.log('💓 Heartbeat -', new Date().toISOString());
}, 30000);
