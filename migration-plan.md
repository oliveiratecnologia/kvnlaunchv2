# 🚀 Plano de Migração Supabase

## 📊 Estrutura Atual da Tabela 'products'

Baseado no código analisado, aqui está a estrutura atual:

```sql
-- Estrutura identificada da tabela 'products'
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Dados básicos do produto
    niche TEXT,
    sub_niche TEXT,
    product_name TEXT,
    description TEXT,
    sale_value NUMERIC,
    sales_copy TEXT,
    
    -- Dados da persona (alguns como JSON, outros como TEXT)
    persona_demographics JSONB,           -- JSON.stringify()
    persona_online_behavior JSONB,        -- JSON.stringify()
    persona_motivations TEXT,             -- join('\n')
    persona_pain_points TEXT,             -- join('\n')
    persona_goals TEXT,                   -- join('\n')
    persona_objections TEXT,              -- join('\n')
    persona_acquisition_channels TEXT,    -- join('\n')
    
    -- Order Bumps (JSONB array)
    order_bumps_data JSONB,
    
    -- Upsell
    upsell_product_name TEXT,
    upsell_description TEXT,
    upsell_sales_copy TEXT,
    upsell_sale_value NUMERIC,
    
    -- Downsell
    downsell_product_name TEXT,
    downsell_description TEXT,
    downsell_sales_copy TEXT,
    downsell_sale_value NUMERIC
);
```

## ⚠️ Problemas Identificados

1. **CRÍTICO**: Credenciais hardcoded em `app/api/produtos/[id]/route.ts`
   ```typescript
   const SUPABASE_URL = 'https://njqennpxwkrzwpneogwl.supabase.co'
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...' // EXPOSTO!
   ```

2. **Inconsistência**: Dados da persona salvos em formatos diferentes (JSON vs TEXT)

3. **Duplicação**: Dois clientes Supabase diferentes em arquivos diferentes

## 🎯 Objetivos da Migração

1. ✅ Criar novo projeto Supabase
2. ✅ Melhorar estrutura da tabela
3. ✅ Fazer backup dos dados atuais
4. ✅ Migrar dados existentes
5. ✅ Corrigir problemas de segurança
6. ✅ Atualizar configurações

## 📋 Checklist de Migração

### ✅ CONCLUÍDO - Documentação Criada
- [x] Analisar estrutura atual do banco de dados
- [x] Criar script de backup (`migration/02-backup-script.sql`)
- [x] Documentar schema melhorado (`migration/01-schema.sql`)
- [x] Criar script de migração de dados (`migration/03-data-migration.sql`)
- [x] Documentar configuração de ambiente (`migration/04-environment-config.md`)
- [x] Criar actions atualizadas (`migration/05-updated-actions.ts`)
- [x] Criar guia passo a passo (`migration/06-step-by-step-guide.md`)
- [x] Identificar correções críticas de segurança (`migration/URGENT-security-fix.md`)

### 🚨 PRÓXIMOS PASSOS - EXECUÇÃO

#### 1. URGENTE - Correções de Segurança (20 min)
- [ ] **PRIMEIRO**: Aplicar correções do arquivo `URGENT-security-fix.md`
- [ ] Remover credenciais hardcoded
- [ ] Configurar `.env.local` adequadamente
- [ ] Testar aplicação após correções

#### 2. Preparação para Migração (30 min)
- [ ] Fazer backup completo dos dados atuais
- [ ] Criar novo projeto no Supabase
- [ ] Aplicar schema melhorado
- [ ] Configurar variáveis de ambiente

#### 3. Migração de Dados (45 min)
- [ ] Export dados do projeto antigo
- [ ] Transform dados para nova estrutura
- [ ] Import dados no novo projeto
- [ ] Validar integridade dos dados

#### 4. Atualização do Código (60 min)
- [ ] Implementar actions atualizadas
- [ ] Testar todas as funcionalidades
- [ ] Validar integração completa

#### 5. Pós-Migração (30 min)
- [ ] Testes completos da aplicação
- [ ] Monitorar logs por 24h
- [ ] Limpeza e documentação final

## 📁 ARQUIVOS DE MIGRAÇÃO CRIADOS

```
migration/
├── 01-schema.sql                    # Schema melhorado para novo Supabase
├── 02-backup-script.sql             # Scripts para backup dos dados atuais
├── 03-data-migration.sql            # Migração e transformação de dados
├── 04-environment-config.md         # Configuração de variáveis de ambiente
├── 05-updated-actions.ts            # Actions atualizadas para nova estrutura
├── 06-step-by-step-guide.md         # Guia completo passo a passo
└── URGENT-security-fix.md           # Correções críticas IMEDIATAS
```
