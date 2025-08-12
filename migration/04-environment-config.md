# 🔐 Configuração das Variáveis de Ambiente

## Arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
# === SUPABASE NOVO ===
# Configurações do novo projeto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-novo-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# Chave de serviço do Supabase (para operações server-side)
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico-aqui

# === OPENAI ===
# Sua chave da API OpenAI
OPENAI_API_KEY=sk-sua-chave-openai-aqui

# === CONFIGURAÇÕES OPCIONAIS ===
# Ambiente da aplicação
NODE_ENV=development

# URL base da aplicação (para produção)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === CONFIGURAÇÕES ANTIGAS (MANTER TEMPORARIAMENTE) ===
# Mantenha estas durante a migração para rollback se necessário
OLD_SUPABASE_URL=https://njqennpxwkrzwpneogwl.supabase.co
OLD_SUPABASE_ANON_KEY=sua-chave-antiga-aqui
```

## ⚠️ Problemas Críticos a Corrigir

### 1. Credenciais Hardcoded

**URGENTE**: O arquivo `app/api/produtos/[id]/route.ts` tem credenciais expostas:

```typescript
// ❌ REMOVER IMEDIATAMENTE
const SUPABASE_URL = 'https://njqennpxwkrzwpneogwl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...'
```

**Substituir por**:
```typescript
// ✅ USAR VARIÁVEIS DE AMBIENTE
import { supabase } from '@/lib/supabaseClient'
```

### 2. Cliente Supabase Duplicado

Atualmente há dois clientes Supabase diferentes. Unificar para usar apenas o de `lib/supabaseClient.ts`.

## 📋 Checklist de Configuração

### Antes da Migração
- [ ] Criar novo projeto no Supabase
- [ ] Copiar URL e chaves do novo projeto
- [ ] Criar arquivo `.env.local` com novas credenciais
- [ ] Fazer backup das credenciais antigas

### Durante a Migração
- [ ] Atualizar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Atualizar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Remover credenciais hardcoded
- [ ] Testar conexão com novo banco

### Pós-Migração
- [ ] Validar todas as funcionalidades
- [ ] Remover variáveis antigas do `.env.local`
- [ ] Confirmar que não há mais credenciais hardcoded
- [ ] Atualizar documentação

## 🔍 Como Obter as Credenciais do Supabase

1. **Acesse seu projeto no Supabase**: https://supabase.com/dashboard
2. **Vá em Settings > API**
3. **Copie**:
   - **URL**: Algo como `https://xxxxxxxxxxx.supabase.co`
   - **anon public**: Chave que começa com `eyJhbGciOiJIUzI1NiIs...`
   - **service_role**: Chave secreta (nunca expor no frontend)

## 🚨 Segurança

- ✅ **NUNCA** commite o arquivo `.env.local`
- ✅ **SEMPRE** use variáveis de ambiente para credenciais
- ✅ **JAMAIS** deixe chaves hardcoded no código
- ✅ **MANTENHA** as chaves `service_role` seguras (apenas server-side)
