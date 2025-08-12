/**
 * 🔄 ACTIONS ATUALIZADAS PARA A NOVA ESTRUTURA SUPABASE
 * 
 * Este arquivo contém as versões atualizadas das actions que funcionam
 * com a nova estrutura JSONB melhorada do banco de dados.
 * 
 * INSTRUÇÕES:
 * 1. Após a migração do banco, substitua as actions em lib/actions/geracao-actions.ts
 * 2. As principais mudanças são na estrutura da persona e upsell/downsell como JSONB
 * 3. Teste todas as funcionalidades após a substituição
 */

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import * as OpenAIService from "@/lib/openai-service";
import type { Subnicho, ProdutoPrincipal, OrderBump, Upsell, Downsell } from "@/types/openai";
import { subnichoSchema, produtoPrincipalSchema, orderBumpSchema, upsellSchema, downsellSchema } from "@/lib/schemas/openai";
import { supabase } from '@/lib/supabaseClient';

const action = createSafeActionClient();

// Schema atualizado para o produto completo com nova estrutura
const produtoCompletoSchemaV2 = z.object({
  nicho: z.string().min(1),
  subnicho: subnichoSchema,
  produtoPrincipal: produtoPrincipalSchema,
  orderBumps: z.array(orderBumpSchema).optional(),
  upsell: upsellSchema.optional(),
  downsell: downsellSchema.optional(),
});

// Todas as outras actions permanecem iguais, apenas a de salvar muda:
// gerarSugestoesNichoAction, validarNichoAction, gerarSubnichosAction, etc.

/**
 * AÇÃO ATUALIZADA: Salvar produto completo com nova estrutura JSONB
 */
export const salvarProdutoCompletoActionV2 = action
    .schema(produtoCompletoSchemaV2)
    .action(async ({ parsedInput }): Promise<{ success: boolean; productId?: string }> => {
        console.log("[Action V2] Iniciando salvarProdutoCompletoActionV2");

        // Mapear para a nova estrutura JSONB melhorada
        const productData = {
            niche: parsedInput.nicho,
            sub_niche: parsedInput.subnicho.nome,
            product_name: parsedInput.produtoPrincipal.nome,
            description: parsedInput.produtoPrincipal.descricao,
            sale_value: parsedInput.produtoPrincipal.valorVenda,
            sales_copy: parsedInput.produtoPrincipal.copyPaginaVendas,
            
            // ✅ NOVA ESTRUTURA: Persona como JSONB estruturado
            persona: parsedInput.produtoPrincipal.persona,
            
            // ✅ NOVA ESTRUTURA: Order bumps como array JSONB
            order_bumps: parsedInput.orderBumps || [],
            
            // ✅ NOVA ESTRUTURA: Upsell como JSONB estruturado
            upsell: parsedInput.upsell ? {
                nome: parsedInput.upsell.nome,
                descricao: parsedInput.upsell.descricao,
                valorVenda: parsedInput.upsell.valorVenda,
                copyPaginaVendas: parsedInput.upsell.copyPaginaVendas
            } : null,
            
            // ✅ NOVA ESTRUTURA: Downsell como JSONB estruturado  
            downsell: parsedInput.downsell ? {
                nome: parsedInput.downsell.nome,
                descricao: parsedInput.downsell.descricao,
                valorVenda: parsedInput.downsell.valorVenda,
                copyPaginaVendas: parsedInput.downsell.copyPaginaVendas
            } : null,
            
            // Metadados
            status: 'active',
            version: 1
        };

        try {
            console.log("[Action V2] Dados preparados para inserção:", {
                niche: productData.niche,
                sub_niche: productData.sub_niche,
                product_name: productData.product_name,
                has_persona: !!productData.persona,
                order_bumps_count: productData.order_bumps.length,
                has_upsell: !!productData.upsell,
                has_downsell: !!productData.downsell
            });

            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select('id')
                .single();

            if (error) {
                console.error("[Action V2] Erro ao inserir no Supabase:", error);
                throw new Error(`Falha ao salvar o produto no banco de dados: ${error.message}`);
            }

            console.log("[Action V2] Produto salvo com sucesso. ID:", data?.id);
            return { success: true, productId: data?.id };

        } catch (error) {
            console.error("[Action V2] Erro capturado:", error);
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error("Erro desconhecido ao salvar o produto.");
            }
        }
    });

/**
 * AÇÃO ATUALIZADA: Buscar produto por ID com nova estrutura
 */
export const buscarProdutoPorIdActionV2 = action
    .schema(z.object({ id: z.string().uuid() }))
    .action(async ({ parsedInput }): Promise<{ product: any }> => {
        console.log("[Action V2] Buscando produto ID:", parsedInput.id);

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', parsedInput.id)
                .single();

            if (error) {
                console.error("[Action V2] Erro ao buscar produto:", error);
                throw new Error(`Produto não encontrado: ${error.message}`);
            }

            // Transformar de volta para o formato esperado pelo frontend
            const transformedProduct = {
                id: data.id,
                createdAt: data.created_at,
                nicho: data.niche,
                subnicho: {
                    nome: data.sub_niche,
                    // Outros campos do subnicho seriam reconstituídos ou buscados separadamente
                },
                produtoPrincipal: {
                    nome: data.product_name,
                    descricao: data.description,
                    valorVenda: data.sale_value,
                    copyPaginaVendas: data.sales_copy,
                    persona: data.persona // Já vem como JSONB estruturado
                },
                orderBumps: data.order_bumps || [],
                upsell: data.upsell, // Já vem como JSONB estruturado
                downsell: data.downsell, // Já vem como JSONB estruturado
                status: data.status,
                version: data.version
            };

            console.log("[Action V2] Produto encontrado e transformado");
            return { product: transformedProduct };

        } catch (error) {
            console.error("[Action V2] Erro ao buscar produto:", error);
            throw new Error(`Falha ao buscar produto: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

/**
 * AÇÃO ATUALIZADA: Listar produtos com nova estrutura
 */
export const listarProdutosActionV2 = action
    .schema(z.object({ 
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        status: z.enum(['active', 'draft', 'archived']).optional()
    }))
    .action(async ({ parsedInput }): Promise<{ products: any[], total: number }> => {
        console.log("[Action V2] Listando produtos:", parsedInput);

        try {
            let query = supabase
                .from('products')
                .select('id, created_at, niche, sub_niche, product_name, description, sale_value, status', { count: 'exact' })
                .order('created_at', { ascending: false });

            if (parsedInput.status) {
                query = query.eq('status', parsedInput.status);
            }

            const { data, error, count } = await query
                .range(
                    (parsedInput.page - 1) * parsedInput.limit,
                    parsedInput.page * parsedInput.limit - 1
                );

            if (error) {
                console.error("[Action V2] Erro ao listar produtos:", error);
                throw new Error(`Falha ao listar produtos: ${error.message}`);
            }

            console.log(`[Action V2] Listados ${data?.length || 0} produtos de ${count || 0} total`);
            return { 
                products: data || [], 
                total: count || 0 
            };

        } catch (error) {
            console.error("[Action V2] Erro ao listar produtos:", error);
            throw new Error(`Falha ao listar produtos: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

// ===== INSTRUÇÕES DE MIGRAÇÃO =====

/*
PASSO A PASSO PARA APLICAR AS NOVAS ACTIONS:

1. Faça backup do arquivo atual:
   cp lib/actions/geracao-actions.ts lib/actions/geracao-actions.backup.ts

2. Substitua as actions antigas pelas novas:
   - salvarProdutoCompletoAction → salvarProdutoCompletoActionV2
   - Adicione buscarProdutoPorIdActionV2 
   - Adicione listarProdutosActionV2

3. Atualize as importações nos componentes:
   - Nos arquivos que usam essas actions, importe as versões V2
   - Teste cada funcionalidade individualmente

4. Validação:
   - Teste criação de novos produtos
   - Teste listagem de produtos  
   - Teste busca por ID
   - Verifique se os dados JSONB estão sendo salvos corretamente

5. Limpeza (após validação):
   - Remova as versions antigas se tudo estiver funcionando
   - Remova o sufixo V2 dos nomes das actions
   - Atualize imports nos componentes
*/
