#!/usr/bin/env node
// api/railway-debug.js
// Versão de debug para Railway

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor de debug...');
console.log('PORT:', port);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware básico
app.use(express.json());

// Health check simples
app.get('/health', (req, res) => {
  console.log('Health check chamado');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'debug-api',
    port: port
  });
});

// Endpoint de teste
app.get('/test', (req, res) => {
  console.log('Test endpoint chamado');
  res.json({
    success: true,
    message: 'API Debug funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('Erro:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: error.message
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`✅ Servidor debug rodando na porta ${port}`);
}).on('error', (err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, encerrando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, encerrando...');
  process.exit(0);
});

console.log('🎯 Servidor configurado, aguardando conexões...');
