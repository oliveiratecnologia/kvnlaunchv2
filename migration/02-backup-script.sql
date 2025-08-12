-- 📥 SCRIPT DE BACKUP DOS DADOS ATUAIS
-- Execute este script no Supabase ANTIGO para fazer backup

-- 1. Export completo da tabela products atual
-- Execute no SQL Editor do Supabase antigo e salve o resultado

SELECT 
    id,
    created_at,
    niche,
    sub_niche,
    product_name,
    description,
    persona_demographics,
    persona_online_behavior,
    persona_motivations,
    persona_pain_points,
    persona_goals,
    persona_objections,
    persona_acquisition_channels,
    sale_value,
    sales_copy,
    order_bumps_data,
    upsell_product_name,
    upsell_description,
    upsell_sales_copy,
    upsell_sale_value,
    downsell_product_name,
    downsell_description,
    downsell_sales_copy,
    downsell_sale_value
FROM public.products
ORDER BY created_at DESC;

-- 2. Contagem de registros para validação
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN niche IS NOT NULL THEN 1 END) as with_niche,
    COUNT(CASE WHEN product_name IS NOT NULL THEN 1 END) as with_product_name,
    COUNT(CASE WHEN order_bumps_data IS NOT NULL THEN 1 END) as with_order_bumps,
    COUNT(CASE WHEN upsell_product_name IS NOT NULL THEN 1 END) as with_upsell,
    COUNT(CASE WHEN downsell_product_name IS NOT NULL THEN 1 END) as with_downsell,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.products;

-- 3. Estrutura da tabela atual (para referência)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Análise de dados para entender melhor a estrutura
SELECT 
    'niche' as field,
    COUNT(DISTINCT niche) as unique_values,
    string_agg(DISTINCT niche, ', ' ORDER BY niche) as sample_values
FROM public.products
WHERE niche IS NOT NULL

UNION ALL

SELECT 
    'sub_niche' as field,
    COUNT(DISTINCT sub_niche) as unique_values,
    string_agg(DISTINCT sub_niche, ', ' ORDER BY sub_niche) as sample_values
FROM public.products
WHERE sub_niche IS NOT NULL

UNION ALL

SELECT 
    'sale_value' as field,
    COUNT(DISTINCT sale_value) as unique_values,
    string_agg(DISTINCT sale_value::text, ', ' ORDER BY sale_value) as sample_values
FROM public.products
WHERE sale_value IS NOT NULL;

-- INSTRUÇÕES DE USO:
-- 1. Execute cada query separadamente no SQL Editor do Supabase antigo
-- 2. Salve os resultados em arquivos CSV ou copie para planilhas
-- 3. Mantenha estes backups seguros antes de fazer a migração
-- 4. Use os dados da query de contagem para validar a migração depois
