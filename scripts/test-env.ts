#!/usr/bin/env tsx
// scripts/test-env.ts

// Carregar variáveis de ambiente
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 Testando variáveis de ambiente...\n');

const vars = [
  'REDIS_URL',
  'KV_URL', 
  'UPSTASH_REDIS_HOST',
  'UPSTASH_REDIS_PORT',
  'UPSTASH_REDIS_PASSWORD',
  'NODE_ENV'
];

vars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mascarar senhas
    if (varName.includes('PASSWORD') || varName.includes('URL')) {
      const masked = value.substring(0, 10) + '***' + value.substring(value.length - 10);
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NÃO DEFINIDA`);
  }
});

console.log('\n🔍 Todas as variáveis de ambiente:');
Object.keys(process.env)
  .filter(key => key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH'))
  .forEach(key => {
    const value = process.env[key];
    if (value) {
      const masked = value.length > 20 ? 
        value.substring(0, 10) + '***' + value.substring(value.length - 10) : 
        value;
      console.log(`   ${key}: ${masked}`);
    }
  });
