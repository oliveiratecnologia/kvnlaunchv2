"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.excluirProduto = exports.atualizarProduto = exports.criarProduto = void 0;
const next_safe_action_1 = require("next-safe-action");
const zod_1 = require("zod");
const appErrors = {
    PRODUTO_NAO_ENCONTRADO: {
        code: "PRODUTO_NAO_ENCONTRADO",
        message: "Produto não encontrado",
    },
    FALHA_AO_CRIAR: {
        code: "FALHA_AO_CRIAR",
        message: "Falha ao criar o produto",
    },
    FALHA_AO_ATUALIZAR: {
        code: "FALHA_AO_ATUALIZAR",
        message: "Falha ao atualizar o produto",
    },
    FALHA_AO_EXCLUIR: {
        code: "FALHA_AO_EXCLUIR",
        message: "Falha ao excluir o produto",
    },
    UNEXPECTED_ERROR: {
        code: "UNEXPECTED_ERROR",
        message: "Ocorreu um erro inesperado",
    },
};
class AppError extends Error {
    constructor(error) {
        super(error.message);
        this.code = error.code;
    }
}
const produtoSchema = zod_1.z.object({
    nome: zod_1.z.string().min(3),
    descricao: zod_1.z.string().min(10).max(500),
    preco: zod_1.z.number().min(0.01),
    categoria: zod_1.z.string(),
    estoque: zod_1.z.number().int().min(0),
});
const deleteSchema = zod_1.z.object({
    id: zod_1.z.string(),
});
const action = (0, next_safe_action_1.createSafeActionClient)();
exports.criarProduto = action.schema(produtoSchema).action(async (input) => {
    try {
        console.log("Criando produto:", input);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
            success: true,
            data: {
                id: Math.random().toString(36).substring(2, 9),
                ...input,
                dataCriacao: new Date().toISOString(),
            },
        };
    }
    catch (error) {
        console.error("Erro ao criar produto:", error);
        return {
            success: false,
            error: error instanceof AppError ? error : appErrors.FALHA_AO_CRIAR,
        };
    }
});
exports.atualizarProduto = action
    .schema(produtoSchema.extend({ id: zod_1.z.string() }))
    .action(async (input) => {
    try {
        console.log("Atualizando produto:", input);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true, data: input };
    }
    catch (error) {
        console.error("Erro ao atualizar produto:", error);
        return {
            success: false,
            error: error instanceof AppError ? error : appErrors.FALHA_AO_ATUALIZAR,
        };
    }
});
exports.excluirProduto = action.schema(deleteSchema).action(async (input) => {
    try {
        console.log("Excluindo produto:", input);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true };
    }
    catch (error) {
        console.error("Erro ao excluir produto:", error);
        return {
            success: false,
            error: error instanceof AppError ? error : appErrors.FALHA_AO_EXCLUIR,
        };
    }
});
