"use server"

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import * as OpenAIService from "@/lib/openai-service";
// Importar tipos da OpenAI para os retornos das actions
import type { Subnicho, ProdutoPrincipal, OrderBump, Upsell, Downsell } from "@/types/openai";
// Importar schemas Zod para validação de entrada
import { subnichoSchema, produtoPrincipalSchema, orderBumpSchema, upsellSchema, downsellSchema, produtoCompletoSchema } from "@/lib/schemas/openai";
import { supabase } from '@/lib/supabaseClient';
import { generateCompleteEbook, EbookData } from "@/lib/pdf-generator";

// Configuração do cliente de ação segura
// Podemos definir um contexto ou metadata se necessário no futuro
const action = createSafeActionClient();

// --- Ações de Geração --- //

// Ação para gerar sugestões de nicho (recebe termo opcional)
export const gerarSugestoesNichoAction = action
    .schema(z.object({ termo: z.string().optional() }))
    .action(async ({ parsedInput }): Promise<{ suggestions: string[] }> => {
        const suggestions = await OpenAIService.generateNichoSuggestions(parsedInput.termo);
        return { suggestions };
        // Erros serão tratados pelo next-safe-action e retornados no campo 'serverError'
    });

// Ação para validar um nicho (tentando gerar subnichos)
// Não retorna os subnichos, apenas valida se a geração é possível
export const validarNichoAction = action
    .schema(z.object({ nicho: z.string().min(1) }))
    .action(async ({ parsedInput }): Promise<{ success: boolean; nicho: string }> => {
        await OpenAIService.generateSubnichos(parsedInput.nicho);
        return { success: true, nicho: parsedInput.nicho };
    });

// Ação para gerar subnichos
export const gerarSubnichosAction = action
    .schema(z.object({ nicho: z.string().min(1) }))
    .action(async ({ parsedInput }): Promise<{ subnichos: Subnicho[] }> => {
        const subnichos = await OpenAIService.generateSubnichos(parsedInput.nicho);
        return { subnichos };
    });

// Ação para gerar o produto principal
export const gerarProdutoPrincipalAction = action
    .schema(z.object({ nicho: z.string().min(1), subnicho: subnichoSchema }))
    .action(async ({ parsedInput }): Promise<{ produtoPrincipal: ProdutoPrincipal }> => {
        console.log(`[Action] Iniciando gerarProdutoPrincipalAction para nicho: ${parsedInput.nicho}, subnicho: ${parsedInput.subnicho.nome}`);
        try {
            const produtoPrincipal = await OpenAIService.generateProdutoPrincipal(parsedInput.nicho, parsedInput.subnicho);
            console.log("[Action] generateProdutoPrincipal executado com sucesso.");
            return { produtoPrincipal };
        } catch (error) {
            console.error("[Action] Erro capturado em gerarProdutoPrincipalAction:", error);
            // Re-lança o erro para ser tratado pelo handleServerError padrão do next-safe-action
            if (error instanceof Error) {
                throw new Error(error.message); // Lança com a mensagem original
            } else {
                throw new Error("Erro desconhecido ao gerar produto principal.");
            }
        }
    });

// Ação para gerar os order bumps
export const gerarOrderBumpsAction = action
    .schema(z.object({
        nicho: z.string().min(1),
        subnicho: subnichoSchema,
        produtoPrincipal: produtoPrincipalSchema
    }))
    .action(async ({ parsedInput }): Promise<{ orderBumps: OrderBump[] }> => {
        console.log(`[Action] Iniciando gerarOrderBumpsAction para nicho: ${parsedInput.nicho}, subnicho: ${parsedInput.subnicho.nome}`);
        
        try {
            // Log dos dados sendo enviados para o serviço
            console.log("[Action] Dados do produto principal:", JSON.stringify({
                nome: parsedInput.produtoPrincipal.nome,
                valorVenda: parsedInput.produtoPrincipal.valorVenda,
                copyLength: parsedInput.produtoPrincipal.copyPaginaVendas?.length || 0,
                hasPersona: !!parsedInput.produtoPrincipal.persona
            }, null, 2));
            
            const orderBumps = await OpenAIService.generateOrderBumps(
                parsedInput.nicho, 
                parsedInput.subnicho, 
                parsedInput.produtoPrincipal
            );
            
            console.log("[Action] generateOrderBumps executado com sucesso.");
            return { orderBumps };
        } catch (error) {
            console.error("[Action] Erro capturado em gerarOrderBumpsAction:", error);
            // Formata uma mensagem de erro mais detalhada para diagnóstico
            const errorDetails = error instanceof Error 
                ? error.message 
                : JSON.stringify(error);
                
            console.error("[Action] Detalhes do erro:", errorDetails);
            
            // Re-lança o erro para ser tratado pelo handleServerError padrão do next-safe-action
            throw new Error(`Erro ao gerar order bumps: ${errorDetails}`);
        }
    });

// Ação para gerar o upsell
export const gerarUpsellAction = action
    .schema(z.object({
        nicho: z.string().min(1),
        subnicho: subnichoSchema,
        produtoPrincipal: produtoPrincipalSchema
    }))
    .action(async ({ parsedInput }): Promise<{ upsell: Upsell }> => {
        const upsell = await OpenAIService.generateUpsell(parsedInput.nicho, parsedInput.subnicho, parsedInput.produtoPrincipal);
        return { upsell };
    });

// Ação para gerar o downsell
export const gerarDownsellAction = action
    .schema(z.object({
        nicho: z.string().min(1),
        subnicho: subnichoSchema,
        produtoPrincipal: produtoPrincipalSchema,
        upsell: upsellSchema // Upsell é necessário para gerar o downsell
    }))
    .action(async ({ parsedInput }): Promise<{ downsell: Downsell }> => {
        console.log(`[Action] Iniciando gerarDownsellAction para nicho: ${parsedInput.nicho}, upsell: ${parsedInput.upsell.nome}`);
        
        try {
            // Log dos dados sendo enviados para o serviço
            console.log("[Action] Dados do upsell:", JSON.stringify({
                nome: parsedInput.upsell.nome,
                valorVenda: parsedInput.upsell.valorVenda,
                copyLength: parsedInput.upsell.copyPaginaVendas?.length || 0
            }, null, 2));
            
            const downsell = await OpenAIService.generateDownsell(
                parsedInput.nicho, 
                parsedInput.subnicho, 
                parsedInput.produtoPrincipal, 
                parsedInput.upsell
            );
            
            console.log("[Action] generateDownsell executado com sucesso.");
            return { downsell };
        } catch (error) {
            console.error("[Action] Erro capturado em gerarDownsellAction:", error);
            // Formata uma mensagem de erro mais detalhada para diagnóstico
            const errorDetails = error instanceof Error 
                ? error.message 
                : JSON.stringify(error);
                
            console.error("[Action] Detalhes do erro:", errorDetails);
            
            // Re-lança o erro para ser tratado pelo handleServerError padrão do next-safe-action
            throw new Error(`Erro ao gerar downsell: ${errorDetails}`);
        }
    });

// **** NOVA ACTION para gerar APENAS a copy ****
// Recebe o produto sem a copy e retorna a string da copy
// O schema de input usa .omit() para remover a copy
export const gerarCopyPaginaVendasAction = action
    .schema(produtoPrincipalSchema.omit({ copyPaginaVendas: true }))
    .action(async ({ parsedInput }): Promise<{ copyPaginaVendas: string }> => {
        console.log(`[Action] Iniciando gerarCopyPaginaVendasAction para produto: ${parsedInput.nome}`);
        try {
            // Log do input que a action está passando para o serviço
            console.log("[Action] Input para generateCopyPaginaVendas:", JSON.stringify(parsedInput, null, 2));
            const copyGerada = await OpenAIService.generateCopyPaginaVendas(parsedInput);
            console.log("[Action] generateCopyPaginaVendas executado com sucesso.");
            return { copyPaginaVendas: copyGerada };
        } catch (error) {
            console.error("[Action] Erro capturado em gerarCopyPaginaVendasAction:", error);
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error("Erro desconhecido ao gerar copy de vendas.");
            }
        }
    });

// Ação para salvar o produto completo no Supabase
export const salvarProdutoCompletoAction = action
    .schema(produtoCompletoSchema) // Usar o schema Zod para o produto completo
    .action(async ({ parsedInput }): Promise<{ success: boolean; productId?: string }> => {
        console.log("[Action] Iniciando salvarProdutoCompletoAction");

        // Mapear parsedInput (validado pelo Zod) para o formato da tabela Supabase
        // O Zod schema garante que todos os campos necessários estão presentes
        const productData = {
            // Campos básicos da tabela
            niche: parsedInput.nicho,
            sub_niche: parsedInput.subnicho.nome, 
            product_name: parsedInput.produtoPrincipal.nome,
            description: parsedInput.produtoPrincipal.descricao,
            sale_value: parsedInput.produtoPrincipal.valorVenda,
            sales_copy: parsedInput.produtoPrincipal.copyPaginaVendas,
            
            // Persona como objeto JSONB completo (mantendo a estrutura original)
            persona: parsedInput.produtoPrincipal.persona || null,
            
            // Order bumps como array JSONB
            order_bumps: parsedInput.orderBumps || [],
            
            // Upsell como objeto JSONB completo (se existir)
            upsell: parsedInput.upsell || null,
            
            // Downsell como objeto JSONB completo (se existir)
            downsell: parsedInput.downsell || null,
            
            // Status padrão
            status: 'active',
            version: 1
        };

        try {
            console.log("[Action] Dados a serem salvos no Supabase:", JSON.stringify(productData, null, 2));
            
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select('id') // Seleciona o ID do produto inserido (agora UUID)
                .single(); // Espera um único resultado

            if (error) {
                console.error("[Action] Erro ao inserir no Supabase:", {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                
                // Tratamento específico para diferentes tipos de erro
                if (error.code === '23505') {
                    throw new Error("Produto duplicado. Este produto já foi salvo anteriormente.");
                } else if (error.code === '23503') {
                    throw new Error("Erro de referência. Verifique se todos os dados necessários foram preenchidos.");
                } else if (error.code === '22P02') {
                    throw new Error("Formato de dados inválido. Verifique os valores inseridos.");
                }
                
                throw new Error(`Falha ao salvar o produto: ${error.message}`);
            }

            if (!data?.id) {
                console.error("[Action] Produto salvo mas ID não retornado");
                throw new Error("Produto salvo mas não foi possível obter o ID");
            }

            console.log("[Action] Produto salvo no Supabase com sucesso. ID:", data.id);
            return { success: true, productId: data.id }; // ID agora é string (UUID)

        } catch (error) {
            console.error("[Action] Erro capturado em salvarProdutoCompletoAction:", error);
            if (error instanceof Error) {
                throw new Error(error.message);
            } else {
                throw new Error("Erro desconhecido ao salvar o produto.");
            }
        }
    });

// Ação para gerar ebook PDF completo
export const gerarEbookPDFAction = action
    .schema(z.object({
        nome: z.string().min(1, "Nome do produto é obrigatório"),
        descricao: z.string().min(1, "Descrição é obrigatória"),
        nicho: z.string().min(1, "Nicho é obrigatório"),
        subnicho: z.string().optional(),
        persona: z.any().optional()
    }))
    .action(async ({ parsedInput }) => {
        try {
            console.log("[Action] Iniciando geração de ebook PDF:", parsedInput.nome);

            const ebookData: EbookData = {
                nome: parsedInput.nome,
                descricao: parsedInput.descricao,
                nicho: parsedInput.nicho,
                subnicho: parsedInput.subnicho || parsedInput.nicho,
                persona: parsedInput.persona
            };

            // Gerar o ebook completo
            const pdfBuffer = await generateCompleteEbook(ebookData);

            // Gerar nome do arquivo
            const fileName = `${parsedInput.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
            const filePath = `ebooks/${fileName}`;

            console.log(`[Action] Salvando PDF no Supabase Storage: ${filePath}`);

            // Upload para Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ebooks')
                .upload(filePath, pdfBuffer, {
                    contentType: 'application/pdf',
                    cacheControl: '3600'
                });

            if (uploadError) {
                console.error('[Action] Erro no upload:', uploadError);
                throw new Error(`Erro ao salvar o ebook: ${uploadError.message}`);
            }

            // Gerar URL pública
            const { data: urlData } = supabase.storage
                .from('ebooks')
                .getPublicUrl(filePath);

            console.log(`[Action] Ebook PDF gerado com sucesso: ${urlData.publicUrl}`);

            return {
                success: true,
                fileName,
                downloadUrl: urlData.publicUrl,
                filePath,
                message: 'Ebook PDF gerado com sucesso!'
            };

        } catch (error) {
            console.error("[Action] Erro na geração do ebook PDF:", error);
            console.error("[Action] Stack trace:", error instanceof Error ? error.stack : 'N/A');
            console.error("[Action] Tipo do erro:", typeof error);
            console.error("[Action] Erro serializado:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

            let errorMessage = "Erro desconhecido na geração do ebook PDF.";

            if (error instanceof Error) {
                errorMessage = `Falha na geração do PDF: ${error.message}`;

                // Verificar se é erro específico do Puppeteer
                if (error.message.includes('Puppeteer') || error.message.includes('browser')) {
                    errorMessage = `Erro no navegador: ${error.message}. Tente novamente em alguns segundos.`;
                }
                // Verificar se é erro de timeout
                else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                    errorMessage = `Timeout na geração: ${error.message}. O processo demorou muito para completar.`;
                }
                // Verificar se é erro de memória
                else if (error.message.includes('memory') || error.message.includes('Memory')) {
                    errorMessage = `Erro de memória: ${error.message}. Tente novamente.`;
                }
                // Verificar se é erro de OpenAI
                else if (error.message.includes('OpenAI') || error.message.includes('API')) {
                    errorMessage = `Erro na API: ${error.message}. Verifique sua conexão.`;
                }
            }

            throw new Error(errorMessage);
        }
    });