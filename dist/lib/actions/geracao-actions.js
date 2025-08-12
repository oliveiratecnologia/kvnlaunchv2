"use strict";
"use server";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarEbookPDFAction = exports.salvarProdutoCompletoAction = exports.gerarCopyPaginaVendasAction = exports.gerarDownsellAction = exports.gerarUpsellAction = exports.gerarOrderBumpsAction = exports.gerarProdutoPrincipalAction = exports.gerarSubnichosAction = exports.validarNichoAction = exports.gerarSugestoesNichoAction = void 0;
const next_safe_action_1 = require("next-safe-action");
const zod_1 = require("zod");
const OpenAIService = __importStar(require("@/lib/openai-service"));
const openai_1 = require("@/lib/schemas/openai");
const supabaseClient_1 = require("@/lib/supabaseClient");
const pdf_generator_1 = require("@/lib/pdf-generator");
const action = (0, next_safe_action_1.createSafeActionClient)();
exports.gerarSugestoesNichoAction = action
    .schema(zod_1.z.object({ termo: zod_1.z.string().optional() }))
    .action(async ({ parsedInput }) => {
    const suggestions = await OpenAIService.generateNichoSuggestions(parsedInput.termo);
    return { suggestions };
});
exports.validarNichoAction = action
    .schema(zod_1.z.object({ nicho: zod_1.z.string().min(1) }))
    .action(async ({ parsedInput }) => {
    await OpenAIService.generateSubnichos(parsedInput.nicho);
    return { success: true, nicho: parsedInput.nicho };
});
exports.gerarSubnichosAction = action
    .schema(zod_1.z.object({ nicho: zod_1.z.string().min(1) }))
    .action(async ({ parsedInput }) => {
    const subnichos = await OpenAIService.generateSubnichos(parsedInput.nicho);
    return { subnichos };
});
exports.gerarProdutoPrincipalAction = action
    .schema(zod_1.z.object({ nicho: zod_1.z.string().min(1), subnicho: openai_1.subnichoSchema }))
    .action(async ({ parsedInput }) => {
    console.log(`[Action] Iniciando gerarProdutoPrincipalAction para nicho: ${parsedInput.nicho}, subnicho: ${parsedInput.subnicho.nome}`);
    try {
        const produtoPrincipal = await OpenAIService.generateProdutoPrincipal(parsedInput.nicho, parsedInput.subnicho);
        console.log("[Action] generateProdutoPrincipal executado com sucesso.");
        return { produtoPrincipal };
    }
    catch (error) {
        console.error("[Action] Erro capturado em gerarProdutoPrincipalAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        else {
            throw new Error("Erro desconhecido ao gerar produto principal.");
        }
    }
});
exports.gerarOrderBumpsAction = action
    .schema(zod_1.z.object({
    nicho: zod_1.z.string().min(1),
    subnicho: openai_1.subnichoSchema,
    produtoPrincipal: openai_1.produtoPrincipalSchema
}))
    .action(async ({ parsedInput }) => {
    console.log(`[Action] Iniciando gerarOrderBumpsAction para nicho: ${parsedInput.nicho}, subnicho: ${parsedInput.subnicho.nome}`);
    try {
        console.log("[Action] Dados do produto principal:", JSON.stringify({
            nome: parsedInput.produtoPrincipal.nome,
            valorVenda: parsedInput.produtoPrincipal.valorVenda,
            copyLength: parsedInput.produtoPrincipal.copyPaginaVendas?.length || 0,
            hasPersona: !!parsedInput.produtoPrincipal.persona
        }, null, 2));
        const orderBumps = await OpenAIService.generateOrderBumps(parsedInput.nicho, parsedInput.subnicho, parsedInput.produtoPrincipal);
        console.log("[Action] generateOrderBumps executado com sucesso.");
        return { orderBumps };
    }
    catch (error) {
        console.error("[Action] Erro capturado em gerarOrderBumpsAction:", error);
        const errorDetails = error instanceof Error
            ? error.message
            : JSON.stringify(error);
        console.error("[Action] Detalhes do erro:", errorDetails);
        throw new Error(`Erro ao gerar order bumps: ${errorDetails}`);
    }
});
exports.gerarUpsellAction = action
    .schema(zod_1.z.object({
    nicho: zod_1.z.string().min(1),
    subnicho: openai_1.subnichoSchema,
    produtoPrincipal: openai_1.produtoPrincipalSchema
}))
    .action(async ({ parsedInput }) => {
    const upsell = await OpenAIService.generateUpsell(parsedInput.nicho, parsedInput.subnicho, parsedInput.produtoPrincipal);
    return { upsell };
});
exports.gerarDownsellAction = action
    .schema(zod_1.z.object({
    nicho: zod_1.z.string().min(1),
    subnicho: openai_1.subnichoSchema,
    produtoPrincipal: openai_1.produtoPrincipalSchema,
    upsell: openai_1.upsellSchema
}))
    .action(async ({ parsedInput }) => {
    console.log(`[Action] Iniciando gerarDownsellAction para nicho: ${parsedInput.nicho}, upsell: ${parsedInput.upsell.nome}`);
    try {
        console.log("[Action] Dados do upsell:", JSON.stringify({
            nome: parsedInput.upsell.nome,
            valorVenda: parsedInput.upsell.valorVenda,
            copyLength: parsedInput.upsell.copyPaginaVendas?.length || 0
        }, null, 2));
        const downsell = await OpenAIService.generateDownsell(parsedInput.nicho, parsedInput.subnicho, parsedInput.produtoPrincipal, parsedInput.upsell);
        console.log("[Action] generateDownsell executado com sucesso.");
        return { downsell };
    }
    catch (error) {
        console.error("[Action] Erro capturado em gerarDownsellAction:", error);
        const errorDetails = error instanceof Error
            ? error.message
            : JSON.stringify(error);
        console.error("[Action] Detalhes do erro:", errorDetails);
        throw new Error(`Erro ao gerar downsell: ${errorDetails}`);
    }
});
exports.gerarCopyPaginaVendasAction = action
    .schema(openai_1.produtoPrincipalSchema.omit({ copyPaginaVendas: true }))
    .action(async ({ parsedInput }) => {
    console.log(`[Action] Iniciando gerarCopyPaginaVendasAction para produto: ${parsedInput.nome}`);
    try {
        console.log("[Action] Input para generateCopyPaginaVendas:", JSON.stringify(parsedInput, null, 2));
        const copyGerada = await OpenAIService.generateCopyPaginaVendas(parsedInput);
        console.log("[Action] generateCopyPaginaVendas executado com sucesso.");
        return { copyPaginaVendas: copyGerada };
    }
    catch (error) {
        console.error("[Action] Erro capturado em gerarCopyPaginaVendasAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        else {
            throw new Error("Erro desconhecido ao gerar copy de vendas.");
        }
    }
});
exports.salvarProdutoCompletoAction = action
    .schema(openai_1.produtoCompletoSchema)
    .action(async ({ parsedInput }) => {
    console.log("[Action] Iniciando salvarProdutoCompletoAction");
    const productData = {
        niche: parsedInput.nicho,
        sub_niche: parsedInput.subnicho.nome,
        product_name: parsedInput.produtoPrincipal.nome,
        description: parsedInput.produtoPrincipal.descricao,
        sale_value: parsedInput.produtoPrincipal.valorVenda,
        sales_copy: parsedInput.produtoPrincipal.copyPaginaVendas,
        persona: parsedInput.produtoPrincipal.persona || null,
        order_bumps: parsedInput.orderBumps || [],
        upsell: parsedInput.upsell || null,
        downsell: parsedInput.downsell || null,
        status: 'active',
        version: 1
    };
    try {
        console.log("[Action] Dados a serem salvos no Supabase:", JSON.stringify(productData, null, 2));
        const { data, error } = await supabaseClient_1.supabase
            .from('products')
            .insert([productData])
            .select('id')
            .single();
        if (error) {
            console.error("[Action] Erro ao inserir no Supabase:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            if (error.code === '23505') {
                throw new Error("Produto duplicado. Este produto já foi salvo anteriormente.");
            }
            else if (error.code === '23503') {
                throw new Error("Erro de referência. Verifique se todos os dados necessários foram preenchidos.");
            }
            else if (error.code === '22P02') {
                throw new Error("Formato de dados inválido. Verifique os valores inseridos.");
            }
            throw new Error(`Falha ao salvar o produto: ${error.message}`);
        }
        if (!data?.id) {
            console.error("[Action] Produto salvo mas ID não retornado");
            throw new Error("Produto salvo mas não foi possível obter o ID");
        }
        console.log("[Action] Produto salvo no Supabase com sucesso. ID:", data.id);
        return { success: true, productId: data.id };
    }
    catch (error) {
        console.error("[Action] Erro capturado em salvarProdutoCompletoAction:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        else {
            throw new Error("Erro desconhecido ao salvar o produto.");
        }
    }
});
exports.gerarEbookPDFAction = action
    .schema(zod_1.z.object({
    nome: zod_1.z.string().min(1, "Nome do produto é obrigatório"),
    descricao: zod_1.z.string().min(1, "Descrição é obrigatória"),
    nicho: zod_1.z.string().min(1, "Nicho é obrigatório"),
    subnicho: zod_1.z.string().optional(),
    persona: zod_1.z.any().optional()
}))
    .action(async ({ parsedInput }) => {
    try {
        console.log("[Action] Iniciando geração de ebook PDF:", parsedInput.nome);
        const ebookData = {
            nome: parsedInput.nome,
            descricao: parsedInput.descricao,
            nicho: parsedInput.nicho,
            subnicho: parsedInput.subnicho || parsedInput.nicho,
            persona: parsedInput.persona
        };
        const pdfBuffer = await (0, pdf_generator_1.generateCompleteEbook)(ebookData);
        const fileName = `${parsedInput.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
        const filePath = `ebooks/${fileName}`;
        console.log(`[Action] Salvando PDF no Supabase Storage: ${filePath}`);
        const { data: uploadData, error: uploadError } = await supabaseClient_1.supabase.storage
            .from('ebooks')
            .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
        });
        if (uploadError) {
            console.error('[Action] Erro no upload:', uploadError);
            throw new Error(`Erro ao salvar o ebook: ${uploadError.message}`);
        }
        const { data: urlData } = supabaseClient_1.supabase.storage
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
    }
    catch (error) {
        console.error("[Action] Erro na geração do ebook PDF:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        else {
            throw new Error("Erro desconhecido na geração do ebook PDF.");
        }
    }
});
