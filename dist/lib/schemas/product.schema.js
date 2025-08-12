"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productUpdateSchema = exports.productCreateSchema = void 0;
const zod_1 = require("zod");
const personaSchema = zod_1.z.object({
    perfilDemografico: zod_1.z.object({
        idade: zod_1.z.string(),
        genero: zod_1.z.string(),
        localizacao: zod_1.z.string(),
        escolaridade: zod_1.z.string(),
        renda: zod_1.z.string(),
        ocupacao: zod_1.z.string()
    }),
    comportamentoOnline: zod_1.z.object({
        tempoOnline: zod_1.z.string(),
        dispositivos: zod_1.z.string(),
        redesSociais: zod_1.z.string()
    }),
    motivacoes: zod_1.z.array(zod_1.z.string()).min(1),
    pontosDeDor: zod_1.z.array(zod_1.z.string()).min(1),
    objetivos: zod_1.z.array(zod_1.z.string()).min(1),
    objecoesComuns: zod_1.z.array(zod_1.z.string()).min(1),
    canaisDeAquisicao: zod_1.z.array(zod_1.z.string()).min(1)
});
const orderBumpSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1),
    descricao: zod_1.z.string().min(1),
    valorVenda: zod_1.z.number().positive(),
    problemaPrincipal: zod_1.z.string().min(1)
});
const upsellDownsellSchema = zod_1.z.object({
    nome: zod_1.z.string().min(1),
    descricao: zod_1.z.string().min(1),
    valorVenda: zod_1.z.number().positive(),
    copyPaginaVendas: zod_1.z.string().min(1)
});
exports.productCreateSchema = zod_1.z.object({
    niche: zod_1.z.string().min(1, 'Nicho é obrigatório'),
    sub_niche: zod_1.z.string().min(1, 'Sub-nicho é obrigatório'),
    product_name: zod_1.z.string().min(1, 'Nome do produto é obrigatório'),
    description: zod_1.z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    sale_value: zod_1.z.number().positive('Valor de venda deve ser positivo'),
    sales_copy: zod_1.z.string().min(50, 'Copy de vendas deve ter pelo menos 50 caracteres'),
    persona: personaSchema,
    order_bumps: zod_1.z.array(orderBumpSchema).optional().default([]),
    upsell: upsellDownsellSchema.optional(),
    downsell: upsellDownsellSchema.optional(),
    status: zod_1.z.enum(['active', 'draft', 'archived']).optional().default('active')
});
exports.productUpdateSchema = exports.productCreateSchema.partial();
