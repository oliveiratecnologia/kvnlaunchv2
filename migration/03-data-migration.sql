-- 🔄 SCRIPT DE MIGRAÇÃO DE DADOS
-- Execute este script no Supabase NOVO após aplicar o schema

-- Função auxiliar para transformar dados da persona
CREATE OR REPLACE FUNCTION transform_persona_data(
    p_demographics jsonb,
    p_online_behavior jsonb, 
    p_motivations text,
    p_pain_points text,
    p_goals text,
    p_objections text,
    p_acquisition_channels text
) RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    -- Construir objeto persona estruturado
    result := jsonb_build_object(
        'perfilDemografico', COALESCE(p_demographics, '{}'::jsonb),
        'comportamentoOnline', COALESCE(p_online_behavior, '{}'::jsonb),
        'motivacoes', CASE 
            WHEN p_motivations IS NOT NULL 
            THEN to_jsonb(string_to_array(p_motivations, E'\n'))
            ELSE '[]'::jsonb
        END,
        'pontosDeDor', CASE 
            WHEN p_pain_points IS NOT NULL 
            THEN to_jsonb(string_to_array(p_pain_points, E'\n'))
            ELSE '[]'::jsonb
        END,
        'objetivos', CASE 
            WHEN p_goals IS NOT NULL 
            THEN to_jsonb(string_to_array(p_goals, E'\n'))
            ELSE '[]'::jsonb
        END,
        'objecoesComuns', CASE 
            WHEN p_objections IS NOT NULL 
            THEN to_jsonb(string_to_array(p_objections, E'\n'))
            ELSE '[]'::jsonb
        END,
        'canaisDeAquisicao', CASE 
            WHEN p_acquisition_channels IS NOT NULL 
            THEN to_jsonb(string_to_array(p_acquisition_channels, E'\n'))
            ELSE '[]'::jsonb
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para transformar upsell/downsell
CREATE OR REPLACE FUNCTION transform_sell_data(
    p_name text,
    p_description text,
    p_copy text,
    p_value numeric
) RETURNS jsonb AS $$
BEGIN
    IF p_name IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN jsonb_build_object(
        'nome', p_name,
        'descricao', COALESCE(p_description, ''),
        'copyPaginaVendas', COALESCE(p_copy, ''),
        'valorVenda', COALESCE(p_value, 0)
    );
END;
$$ LANGUAGE plpgsql;

-- MIGRAÇÃO DOS DADOS
-- Substitua os dados entre /* */ pelos dados reais do seu backup

/*
-- EXEMPLO DE INSERT COM DADOS TRANSFORMADOS:
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
) VALUES (
    'uuid-do-produto-original',
    'timestamp-original',
    'Marketing Digital',
    'Marketing Digital para Afiliados',
    'Método Completo de Marketing Digital para Afiliados',
    'Descrição do produto...',
    47.00,
    'Copy da página de vendas...',
    transform_persona_data(
        '{"idade": "30-45 anos", "genero": "55% homens"}'::jsonb,  -- persona_demographics
        '{"tempoOnline": "3-5 horas"}'::jsonb,                     -- persona_online_behavior
        'Motivação 1\nMotivação 2\nMotivação 3',                  -- persona_motivations
        'Dor 1\nDor 2\nDor 3',                                    -- persona_pain_points
        'Objetivo 1\nObjetivo 2',                                 -- persona_goals
        'Objeção 1\nObjeção 2',                                   -- persona_objections
        'Canal 1\nCanal 2'                                        -- persona_acquisition_channels
    ),
    '[{"nome": "Order Bump 1", "valorVenda": 9.90}]'::jsonb,      -- order_bumps_data
    transform_sell_data(
        'Nome do Upsell',                                         -- upsell_product_name
        'Descrição do Upsell',                                    -- upsell_description
        'Copy do Upsell',                                         -- upsell_sales_copy
        97.00                                                     -- upsell_sale_value
    ),
    transform_sell_data(
        'Nome do Downsell',                                       -- downsell_product_name
        'Descrição do Downsell',                                  -- downsell_description
        'Copy do Downsell',                                       -- downsell_sales_copy
        27.00                                                     -- downsell_sale_value
    ),
    'active'
);
*/

-- TEMPLATE PARA MIGRAÇÃO AUTOMATIZADA
-- Use este template para cada produto do backup:

/*
WITH migrated_data AS (
  SELECT 
    id,
    created_at,
    niche,
    sub_niche,
    product_name,
    description,
    sale_value,
    sales_copy,
    transform_persona_data(
      persona_demographics::jsonb,
      persona_online_behavior::jsonb,
      persona_motivations,
      persona_pain_points,
      persona_goals,
      persona_objections,
      persona_acquisition_channels
    ) as persona,
    COALESCE(order_bumps_data, '[]'::jsonb) as order_bumps,
    transform_sell_data(
      upsell_product_name,
      upsell_description,
      upsell_sales_copy,
      upsell_sale_value
    ) as upsell,
    transform_sell_data(
      downsell_product_name,
      downsell_description,
      downsell_sales_copy,
      downsell_sale_value
    ) as downsell
  FROM (
    -- COLE AQUI OS DADOS DO SEU BACKUP COMO VALUES
    VALUES 
      ('uuid-1', 'timestamp-1', 'niche-1', 'sub-niche-1', 'product-1', 'desc-1', 47.00, 'copy-1', '{}', '{}', 'mot-1', 'pain-1', 'goal-1', 'obj-1', 'acq-1', '[]', 'upsell-name-1', 'upsell-desc-1', 'upsell-copy-1', 97.00, 'down-name-1', 'down-desc-1', 'down-copy-1', 27.00)
  ) AS backup_data(
    id, created_at, niche, sub_niche, product_name, description, sale_value, sales_copy,
    persona_demographics, persona_online_behavior, persona_motivations, persona_pain_points, 
    persona_goals, persona_objections, persona_acquisition_channels, order_bumps_data,
    upsell_product_name, upsell_description, upsell_sales_copy, upsell_sale_value,
    downsell_product_name, downsell_description, downsell_sales_copy, downsell_sale_value
  )
)
INSERT INTO public.products (
  id, created_at, niche, sub_niche, product_name, description, 
  sale_value, sales_copy, persona, order_bumps, upsell, downsell, status
)
SELECT 
  id, created_at::timestamptz, niche, sub_niche, product_name, description,
  sale_value, sales_copy, persona, order_bumps, upsell, downsell, 'active'
FROM migrated_data;
*/

-- Validação pós-migração
SELECT 
    COUNT(*) as total_migrated,
    COUNT(CASE WHEN persona IS NOT NULL THEN 1 END) as with_persona,
    COUNT(CASE WHEN order_bumps != '[]'::jsonb THEN 1 END) as with_order_bumps,
    COUNT(CASE WHEN upsell IS NOT NULL THEN 1 END) as with_upsell,
    COUNT(CASE WHEN downsell IS NOT NULL THEN 1 END) as with_downsell
FROM public.products;

-- Limpar funções auxiliares após migração
-- DROP FUNCTION IF EXISTS transform_persona_data(jsonb, jsonb, text, text, text, text, text);
-- DROP FUNCTION IF EXISTS transform_sell_data(text, text, text, numeric);
