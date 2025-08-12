-- 🚀 MIGRAÇÃO SIMPLES DOS DADOS
-- Execute este script no NOVO SUPABASE após substituir os dados do backup

-- 1. PRIMEIRO: Criar as funções auxiliares
CREATE OR REPLACE FUNCTION safe_parse_jsonb(input_text text) 
RETURNS jsonb AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN '{}'::jsonb;
    END IF;
    
    BEGIN
        RETURN input_text::jsonb;
    EXCEPTION WHEN others THEN
        RETURN '{}'::jsonb;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION text_to_array_jsonb(input_text text) 
RETURNS jsonb AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN '[]'::jsonb;
    END IF;
    
    RETURN to_jsonb(string_to_array(input_text, E'\n'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_uuid_convert(input_text text) 
RETURNS uuid AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN gen_random_uuid();
    END IF;
    
    BEGIN
        RETURN input_text::uuid;
    EXCEPTION WHEN others THEN
        RETURN gen_random_uuid();
    END;
END;
$$ LANGUAGE plpgsql;

-- 2. MIGRAÇÃO DOS DADOS
-- INSTRUÇÕES:
-- a) Substitua a seção VALUES abaixo pelos dados do seu backup
-- b) Use o formato: (id, created_at, niche, sub_niche, ...)
-- c) Execute este script completo

INSERT INTO public.products (
    id,
    created_at,
    niche,
    sub_niche,
    product_name,
    description,
    sale_value,
    sales_copy,
    persona,
    order_bumps,
    upsell,
    downsell,
    status
)
SELECT 
    safe_uuid_convert(id),
    created_at::timestamptz,
    niche,
    sub_niche,
    product_name,
    description,
    sale_value::numeric,
    sales_copy,
    -- Persona estruturada
    jsonb_build_object(
        'perfilDemografico', safe_parse_jsonb(persona_demographics),
        'comportamentoOnline', safe_parse_jsonb(persona_online_behavior),
        'motivacoes', text_to_array_jsonb(persona_motivations),
        'pontosDeDor', text_to_array_jsonb(persona_pain_points),
        'objetivos', text_to_array_jsonb(persona_goals),
        'objecoesComuns', text_to_array_jsonb(persona_objections),
        'canaisDeAquisicao', text_to_array_jsonb(persona_acquisition_channels)
    ) as persona,
    -- Order Bumps
    COALESCE(safe_parse_jsonb(order_bumps_data), '[]'::jsonb) as order_bumps,
    -- Upsell
    CASE 
        WHEN upsell_product_name IS NOT NULL THEN
            jsonb_build_object(
                'nome', upsell_product_name,
                'descricao', COALESCE(upsell_description, ''),
                'copyPaginaVendas', COALESCE(upsell_sales_copy, ''),
                'valorVenda', COALESCE(upsell_sale_value::numeric, 0::numeric)
            )
        ELSE NULL
    END as upsell,
    -- Downsell
    CASE 
        WHEN downsell_product_name IS NOT NULL THEN
            jsonb_build_object(
                'nome', downsell_product_name,
                'descricao', COALESCE(downsell_description, ''),
                'copyPaginaVendas', COALESCE(downsell_sales_copy, ''),
                'valorVenda', COALESCE(downsell_sale_value::numeric, 0::numeric)
            )
        ELSE NULL
    END as downsell,
    'active' as status
FROM (
    -- 📋 COLE AQUI OS DADOS DO SEU BACKUP
    -- Substitua esta linha pelos dados reais:
    VALUES 
        -- EXEMPLO (SUBSTITUIR):
        -- ('uuid-aqui', '2024-01-01 10:00:00', 'Marketing Digital', 'Afiliados', 'Produto Teste', 'Descrição teste', 47.00, 'Copy teste', '{"idade": "30-40"}', '{"tempo": "3h"}', 'Motivação 1\nMotivação 2', 'Dor 1\nDor 2', 'Goal 1', 'Objeção 1', 'Canal 1', '[]', 'Upsell Teste', 'Desc Up', 'Copy Up', 97.00, 'Down Teste', 'Desc Down', 'Copy Down', 27.00)
        
        ('exemplo-uuid', '2024-01-01 10:00:00', 'exemplo', 'exemplo', 'produto exemplo', 'descrição exemplo', 1.00, 'copy exemplo', '{}', '{}', '', '', '', '', '', '[]', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
        
        -- 👆 SUBSTITUA esta linha pelos seus dados reais do backup
        -- Formato: (id, created_at, niche, sub_niche, product_name, description, sale_value, sales_copy, persona_demographics, persona_online_behavior, persona_motivations, persona_pain_points, persona_goals, persona_objections, persona_acquisition_channels, order_bumps_data, upsell_product_name, upsell_description, upsell_sales_copy, upsell_sale_value, downsell_product_name, downsell_description, downsell_sales_copy, downsell_sale_value)

) AS backup_data(
    id, created_at, niche, sub_niche, product_name, description, sale_value, sales_copy,
    persona_demographics, persona_online_behavior, persona_motivations, persona_pain_points, 
    persona_goals, persona_objections, persona_acquisition_channels, order_bumps_data,
    upsell_product_name, upsell_description, upsell_sales_copy, upsell_sale_value,
    downsell_product_name, downsell_description, downsell_sales_copy, downsell_sale_value
);

-- 3. VERIFICAÇÃO DOS DADOS MIGRADOS
SELECT 
    'MIGRAÇÃO CONCLUÍDA' as status,
    COUNT(*) as total_produtos,
    COUNT(CASE WHEN persona ? 'perfilDemografico' THEN 1 END) as com_persona,
    COUNT(CASE WHEN order_bumps != '[]'::jsonb THEN 1 END) as com_order_bumps,
    COUNT(CASE WHEN upsell IS NOT NULL THEN 1 END) as com_upsell,
    COUNT(CASE WHEN downsell IS NOT NULL THEN 1 END) as com_downsell,
    MIN(created_at) as registro_mais_antigo,
    MAX(created_at) as registro_mais_recente
FROM public.products;

-- 4. LIMPEZA (Execute apenas após confirmar que tudo funcionou)
-- DROP FUNCTION IF EXISTS safe_parse_jsonb(text);
-- DROP FUNCTION IF EXISTS text_to_array_jsonb(text);
-- DROP FUNCTION IF EXISTS safe_uuid_convert(text);
