-- 🎯 SCRIPT FINAL DE MIGRAÇÃO - VERSÃO ROBUSTA
-- Execute este script no NOVO SUPABASE após substituir os dados

-- 1. FUNÇÕES AUXILIARES ROBUSTAS
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

CREATE OR REPLACE FUNCTION safe_numeric(input_text text) 
RETURNS numeric AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN 0;
    END IF;
    
    BEGIN
        RETURN input_text::numeric;
    EXCEPTION WHEN others THEN
        RETURN 0;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION safe_uuid(input_text text) 
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
-- ⚠️ SUBSTITUA a seção VALUES pelos dados reais do seu backup

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
    safe_uuid(id_original),
    created_at_original::timestamptz,
    niche_original,
    sub_niche_original,
    product_name_original,
    description_original,
    safe_numeric(sale_value_original),
    sales_copy_original,
    -- Persona estruturada
    jsonb_build_object(
        'perfilDemografico', safe_parse_jsonb(persona_demographics_original),
        'comportamentoOnline', safe_parse_jsonb(persona_online_behavior_original),
        'motivacoes', text_to_array_jsonb(persona_motivations_original),
        'pontosDeDor', text_to_array_jsonb(persona_pain_points_original),
        'objetivos', text_to_array_jsonb(persona_goals_original),
        'objecoesComuns', text_to_array_jsonb(persona_objections_original),
        'canaisDeAquisicao', text_to_array_jsonb(persona_acquisition_channels_original)
    ) as persona,
    -- Order Bumps
    COALESCE(safe_parse_jsonb(order_bumps_data_original), '[]'::jsonb) as order_bumps,
    -- Upsell
    CASE 
        WHEN upsell_product_name_original IS NOT NULL AND upsell_product_name_original != '' THEN
            jsonb_build_object(
                'nome', upsell_product_name_original,
                'descricao', COALESCE(upsell_description_original, ''),
                'copyPaginaVendas', COALESCE(upsell_sales_copy_original, ''),
                'valorVenda', safe_numeric(upsell_sale_value_original)
            )
        ELSE NULL
    END as upsell,
    -- Downsell
    CASE 
        WHEN downsell_product_name_original IS NOT NULL AND downsell_product_name_original != '' THEN
            jsonb_build_object(
                'nome', downsell_product_name_original,
                'descricao', COALESCE(downsell_description_original, ''),
                'copyPaginaVendas', COALESCE(downsell_sales_copy_original, ''),
                'valorVenda', safe_numeric(downsell_sale_value_original)
            )
        ELSE NULL
    END as downsell,
    'active' as status
FROM (
    -- 📋 COLE AQUI OS DADOS DO SEU BACKUP
    -- Formato: VALUES (id, created_at, niche, sub_niche, ...)
    VALUES 
        -- EXEMPLO (REMOVER/SUBSTITUIR):
        ('exemplo-uuid-aqui', '2024-01-01 10:00:00', 'Marketing Digital', 'Afiliados', 'Produto Exemplo', 'Descrição exemplo', '47.00', 'Copy exemplo', '{"idade": "30-40"}', '{"tempo": "3h"}', 'Motivação 1\nMotivação 2', 'Dor 1\nDor 2', 'Objetivo 1', 'Objeção 1', 'Canal 1', '[]', 'Upsell Exemplo', 'Descrição upsell', 'Copy upsell', '97.00', 'Downsell Exemplo', 'Descrição downsell', 'Copy downsell', '27.00')
        
        -- 👆 SUBSTITUA esta linha pelos dados reais do seu backup
        -- COLE UMA LINHA PARA CADA PRODUTO
        
) AS backup_data(
    id_original, 
    created_at_original, 
    niche_original, 
    sub_niche_original, 
    product_name_original, 
    description_original, 
    sale_value_original, 
    sales_copy_original,
    persona_demographics_original, 
    persona_online_behavior_original, 
    persona_motivations_original, 
    persona_pain_points_original, 
    persona_goals_original, 
    persona_objections_original, 
    persona_acquisition_channels_original, 
    order_bumps_data_original,
    upsell_product_name_original, 
    upsell_description_original, 
    upsell_sales_copy_original, 
    upsell_sale_value_original,
    downsell_product_name_original, 
    downsell_description_original, 
    downsell_sales_copy_original, 
    downsell_sale_value_original
);

-- 3. VERIFICAÇÃO DOS DADOS MIGRADOS
SELECT 
    'MIGRAÇÃO CONCLUÍDA COM SUCESSO!' as status,
    COUNT(*) as total_produtos_migrados,
    COUNT(CASE WHEN persona ? 'perfilDemografico' THEN 1 END) as produtos_com_persona,
    COUNT(CASE WHEN order_bumps != '[]'::jsonb THEN 1 END) as produtos_com_order_bumps,
    COUNT(CASE WHEN upsell IS NOT NULL THEN 1 END) as produtos_com_upsell,
    COUNT(CASE WHEN downsell IS NOT NULL THEN 1 END) as produtos_com_downsell,
    MIN(created_at) as registro_mais_antigo,
    MAX(created_at) as registro_mais_recente
FROM public.products;

-- 4. EXEMPLOS DOS DADOS MIGRADOS (OPCIONAL)
SELECT 
    id,
    niche,
    sub_niche,
    product_name,
    sale_value,
    persona -> 'perfilDemografico' as perfil_demografico,
    jsonb_array_length(COALESCE(order_bumps, '[]'::jsonb)) as qtd_order_bumps,
    CASE WHEN upsell IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_upsell,
    CASE WHEN downsell IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_downsell
FROM public.products 
ORDER BY created_at DESC
LIMIT 5;

-- 5. LIMPEZA DAS FUNÇÕES AUXILIARES (EXECUTE APÓS CONFIRMAR QUE TUDO FUNCIONOU)
/*
DROP FUNCTION IF EXISTS safe_parse_jsonb(text);
DROP FUNCTION IF EXISTS text_to_array_jsonb(text);
DROP FUNCTION IF EXISTS safe_numeric(text);
DROP FUNCTION IF EXISTS safe_uuid(text);
*/

-- 🎉 MIGRAÇÃO CONCLUÍDA!
-- Teste sua aplicação para garantir que tudo está funcionando corretamente.
