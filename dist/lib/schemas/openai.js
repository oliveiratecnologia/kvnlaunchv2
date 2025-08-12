"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoCompletoSchema = exports.downsellSchema = exports.upsellSchema = exports.orderBumpSchema = exports.produtoPrincipalSchema = exports.personaDetalhadaSchema = exports.subnichoSchema = void 0;
const zod_1 = require("zod");
exports.subnichoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    nome: zod_1.z.string(),
    pesquisasMensais: zod_1.z.number(),
    cpc: zod_1.z.number(),
    palavrasChave: zod_1.z.array(zod_1.z.string()),
    termosPesquisa: zod_1.z.array(zod_1.z.string()),
    potencialRentabilidade: zod_1.z.number(),
});
exports.personaDetalhadaSchema = zod_1.z.object({
    perfilDemografico: zod_1.z.object({
        idade: zod_1.z.string(),
        genero: zod_1.z.string(),
        localizacao: zod_1.z.string(),
        escolaridade: zod_1.z.string(),
        renda: zod_1.z.string(),
        ocupacao: zod_1.z.string(),
    }),
    comportamentoOnline: zod_1.z.object({
        tempoOnline: zod_1.z.string(),
        dispositivos: zod_1.z.string(),
        redesSociais: zod_1.z.string(),
    }),
    motivacoes: zod_1.z.array(zod_1.z.string()),
    pontosDeDor: zod_1.z.array(zod_1.z.string()),
    objetivos: zod_1.z.array(zod_1.z.string()),
    objecoesComuns: zod_1.z.array(zod_1.z.string()),
    canaisDeAquisicao: zod_1.z.array(zod_1.z.string()),
});
exports.produtoPrincipalSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    descricao: zod_1.z.string(),
    persona: exports.personaDetalhadaSchema,
    valorVenda: zod_1.z.number(),
    copyPaginaVendas: zod_1.z.string(),
});
exports.orderBumpSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    descricao: zod_1.z.string(),
    valorVenda: zod_1.z.number(),
    problemaPrincipal: zod_1.z.string().optional(),
});
exports.upsellSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    descricao: zod_1.z.string(),
    valorVenda: zod_1.z.number(),
    copyPaginaVendas: zod_1.z.string(),
});
exports.downsellSchema = zod_1.z.object({
    nome: zod_1.z.string(),
    descricao: zod_1.z.string(),
    valorVenda: zod_1.z.number(),
    copyPaginaVendas: zod_1.z.string(),
});
exports.produtoCompletoSchema = zod_1.z.object({
    nicho: zod_1.z.string().min(1, "Nicho é obrigatório"),
    subnicho: exports.subnichoSchema,
    produtoPrincipal: exports.produtoPrincipalSchema,
    orderBumps: zod_1.z.array(exports.orderBumpSchema).optional(),
    upsell: exports.upsellSchema.optional(),
    downsell: exports.downsellSchema.optional(),
});
