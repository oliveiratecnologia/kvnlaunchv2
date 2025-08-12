-- Criar tabela de clientes para capturar dados antes da criação do funil
-- Execute este script no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Dados pessoais do cliente
    nome_completo TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    instagram TEXT NOT NULL,
    monetizacao TEXT NOT NULL,
    
    -- Status do cliente
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Metadados
    funis_criados INTEGER DEFAULT 0,
    ultimo_acesso TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON public.clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security) - opcional, mas recomendado
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de novos clientes
CREATE POLICY "Permitir inserção de clientes" ON public.clientes
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de clientes (você pode restringir conforme necessário)
CREATE POLICY "Permitir leitura de clientes" ON public.clientes
    FOR SELECT USING (true);

-- Política para permitir atualização de clientes
CREATE POLICY "Permitir atualização de clientes" ON public.clientes
    FOR UPDATE USING (true);

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE public.clientes IS 'Tabela para armazenar dados dos clientes capturados antes da criação do funil';
COMMENT ON COLUMN public.clientes.nome_completo IS 'Nome completo do cliente';
COMMENT ON COLUMN public.clientes.email IS 'E-mail do cliente (único)';
COMMENT ON COLUMN public.clientes.telefone IS 'Telefone de contato do cliente';
COMMENT ON COLUMN public.clientes.instagram IS 'Perfil do Instagram do cliente';
COMMENT ON COLUMN public.clientes.monetizacao IS 'Como o cliente atualmente monetiza sua audiência';
COMMENT ON COLUMN public.clientes.funis_criados IS 'Número total de funis criados por este cliente';
COMMENT ON COLUMN public.clientes.ultimo_acesso IS 'Data/hora do último acesso do cliente';

-- Verificar se a tabela foi criada com sucesso
SELECT 
    'Tabela clientes criada com sucesso!' as status,
    COUNT(*) as total_clientes
FROM public.clientes;
