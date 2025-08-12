# 🚀 Guia Passo a Passo - Migração Supabase

## 📋 Ordem de Execução (CRÍTICA)

### FASE 1: PREPARAÇÃO (30 min)

#### 1.1 Backup dos Dados Atuais
```bash
# 1. Acesse o Supabase Dashboard do projeto antigo
# 2. Vá em SQL Editor
# 3. Execute o script: migration/02-backup-script.sql
# 4. Salve todos os resultados em arquivos CSV
```

#### 1.2 Correção Crítica de Segurança
```bash
# ⚠️ URGENTE: Remover credenciais hardcoded
```

**Editar `app/api/produtos/[id]/route.ts`:**
```typescript
// ❌ REMOVER estas linhas:
const SUPABASE_URL = 'https://njqennpxwkrzwpneogwl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ SUBSTITUIR por:
import { supabase } from '@/lib/supabaseClient'
```

#### 1.3 Criar Arquivo de Ambiente
```bash
# Criar .env.local na raiz do projeto
# Usar o template em migration/04-environment-config.md
```

### FASE 2: NOVO PROJETO SUPABASE (20 min)

#### 2.1 Criar Novo Projeto
1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Configure:
   - **Nome**: `criador-produtos-v2`
   - **Organização**: Sua organização
   - **Região**: South America (São Paulo) - sa-east-1
   - **Password**: Gere uma senha forte

#### 2.2 Configurar Novo Schema
```sql
-- Execute no SQL Editor do novo projeto
-- Usar script: migration/01-schema.sql
```

#### 2.3 Configurar Variáveis de Ambiente
```bash
# Atualizar .env.local com as credenciais do novo projeto
NEXT_PUBLIC_SUPABASE_URL=https://seu-novo-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-nova-chave-aqui
```

### FASE 3: MIGRAÇÃO DE DADOS (45 min)

#### 3.1 Preparar Dados para Migração
```sql
-- 1. Use o backup da Fase 1
-- 2. Organize os dados no formato do script migration/03-data-migration.sql
-- 3. Execute a migração no novo banco
```

#### 3.2 Validar Migração
```sql
-- Execute as queries de validação no final do migration/03-data-migration.sql
-- Compare com os números do backup original
```

### FASE 4: ATUALIZAÇÃO DO CÓDIGO (60 min)

#### 4.1 Atualizar Actions
```bash
# 1. Backup das actions atuais
cp lib/actions/geracao-actions.ts lib/actions/geracao-actions.backup.ts

# 2. Implementar as novas actions do arquivo migration/05-updated-actions.ts
# 3. Testar cada action individualmente
```

#### 4.2 Testar Funcionalidades
- [ ] Login/Auth (se houver)
- [ ] Criação de novo produto
- [ ] Listagem de produtos
- [ ] Visualização de produto individual
- [ ] Busca e filtros

### FASE 5: VALIDAÇÃO E LIMPEZA (30 min)

#### 5.1 Testes Completos
```bash
# Executar em ambiente de desenvolvimento
npm run dev

# Testar fluxo completo:
# 1. Criar nicho
# 2. Selecionar subnicho  
# 3. Gerar produto principal
# 4. Gerar order bumps
# 5. Gerar upsell/downsell
# 6. Salvar produto
# 7. Visualizar produto salvo
```

#### 5.2 Limpeza Final
- [ ] Remover variáveis de ambiente antigas
- [ ] Remover arquivos de backup não necessários  
- [ ] Verificar se não há mais credenciais hardcoded
- [ ] Atualizar documentação

## ⚠️ PROBLEMAS CRÍTICOS A CORRIGIR

### 1. Credenciais Expostas (CRÍTICO)
**Arquivo**: `app/api/produtos/[id]/route.ts`
**Problema**: Chaves do Supabase hardcoded
**Solução**: Usar import do supabaseClient

### 2. Configuração Insegura (CRÍTICO)  
**Arquivo**: `next.config.mjs`
**Problema**: `ignoreBuildErrors: true` e `ignoreDuringBuilds: true`
**Solução**: Remover essas configurações

### 3. Estrutura de Dados Inconsistente
**Problema**: Persona salvos em formatos mistos (JSON + TEXT)
**Solução**: Nova estrutura JSONB unificada

## 🔍 CHECKLIST DE VALIDAÇÃO

### Pré-Migração
- [ ] Backup completo realizado
- [ ] Credenciais hardcoded removidas
- [ ] Novo projeto Supabase criado
- [ ] Schema aplicado no novo projeto

### Durante a Migração
- [ ] Dados migrados sem erros
- [ ] Contagem de registros confere
- [ ] Estrutura JSONB validada
- [ ] Actions atualizadas

### Pós-Migração
- [ ] Todas as funcionalidades testadas
- [ ] Performance aceitável
- [ ] Logs sem erros críticos
- [ ] Rollback plan definido

## 🚨 PLANO DE ROLLBACK

Se algo der errado durante a migração:

1. **Reverter arquivo `.env.local`**:
   ```bash
   # Voltar para as credenciais antigas
   NEXT_PUBLIC_SUPABASE_URL=https://njqennpxwkrzwpneogwl.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=chave-antiga-aqui
   ```

2. **Reverter actions**:
   ```bash
   cp lib/actions/geracao-actions.backup.ts lib/actions/geracao-actions.ts
   ```

3. **Restart da aplicação**:
   ```bash
   npm run dev
   ```

## 📞 CONTATOS E SUPORTE

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Support**: https://supabase.com/dashboard/support
- **Next.js Docs**: https://nextjs.org/docs

## 📊 ESTIMATIVA DE TEMPO

| Fase | Tempo Estimado | Criticidade |
|------|----------------|-------------|
| Preparação | 30 min | 🔴 Alta |
| Novo Projeto | 20 min | 🟡 Média |
| Migração | 45 min | 🔴 Alta |  
| Código | 60 min | 🟡 Média |
| Validação | 30 min | 🔴 Alta |
| **TOTAL** | **~3h** | - |

💡 **Dica**: Reserve pelo menos 4 horas para fazer com calma e ter margem para resolver imprevistos.
