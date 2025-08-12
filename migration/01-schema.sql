-- 🗄️ SCHEMA MELHORADO PARA NOVO SUPABASE
-- Execute este script no novo projeto Supabase

-- Criar tabela products com estrutura melhorada
CREATE TABLE IF NOT EXISTS public.products (
    -- Identificação
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Dados básicos do produto (NOT NULL onde faz sentido)
    niche TEXT NOT NULL,
    sub_niche TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT NOT NULL,
    sale_value NUMERIC(10,2) NOT NULL CHECK (sale_value > 0),
    sales_copy TEXT NOT NULL,
    
    -- Persona completa como JSONB estruturado
    persona JSONB NOT NULL,
    
    -- Order Bumps como array JSONB
    order_bumps JSONB DEFAULT '[]'::jsonb,
    
    -- Upsell (estruturado como JSONB)
    upsell JSONB,
    
    -- Downsell (estruturado como JSONB)
    downsell JSONB,
    
    -- Metadados úteis
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    version INTEGER DEFAULT 1
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_niche ON public.products(niche);
CREATE INDEX IF NOT EXISTS idx_products_sub_niche ON public.products(sub_niche);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_persona ON public.products USING GIN (persona);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Desabilitado inicialmente para desenvolvimento
-- ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE public.products IS 'Tabela principal para armazenar produtos digitais criados pela aplicação';
COMMENT ON COLUMN public.products.persona IS 'Dados completos da persona em formato JSONB estruturado';
COMMENT ON COLUMN public.products.order_bumps IS 'Array de order bumps em formato JSONB';
COMMENT ON COLUMN public.products.upsell IS 'Dados do upsell em formato JSONB';
COMMENT ON COLUMN public.products.downsell IS 'Dados do downsell em formato JSONB';
COMMENT ON COLUMN public.products.status IS 'Status do produto: active, draft, archived';

-- Exemplo da estrutura esperada do JSONB persona:
/*
{
  "perfilDemografico": {
    "idade": "30-45 anos",
    "genero": "55% homens, 45% mulheres",
    "localizacao": "Capitais e grandes cidades",
    "escolaridade": "Ensino superior completo (65%)",
    "renda": "R$ 5.000 a R$ 12.000 mensais",
    "ocupacao": "Profissionais liberais, empreendedores"
  },
  "comportamentoOnline": {
    "tempoOnline": "3-5 horas diárias",
    "dispositivos": "Smartphone (65%), notebook (30%)",
    "redesSociais": "Instagram, LinkedIn, YouTube"
  },
  "motivacoes": ["Motivação 1", "Motivação 2", "Motivação 3"],
  "pontosDeDor": ["Ponto de dor 1", "Ponto de dor 2", "Ponto de dor 3"],
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
  "objecoesComuns": ["Objeção 1", "Objeção 2", "Objeção 3"],
  "canaisDeAquisicao": ["Canal 1", "Canal 2", "Canal 3"]
}
*/

-- Exemplo da estrutura esperada do JSONB order_bumps:
/*
[
  {
    "nome": "Nome do Order Bump 1",
    "descricao": "Descrição detalhada",
    "valorVenda": 9.90,
    "problemaPrincipal": "Problema que resolve"
  },
  {
    "nome": "Nome do Order Bump 2", 
    "descricao": "Descrição detalhada",
    "valorVenda": 9.90,
    "problemaPrincipal": "Problema que resolve"
  }
]
*/

-- Exemplo da estrutura esperada do JSONB upsell/downsell:
/*
{
  "nome": "Nome do Produto",
  "descricao": "Descrição detalhada",
  "valorVenda": 97.00,
  "copyPaginaVendas": "Copy completa da página de vendas"
}
*/
