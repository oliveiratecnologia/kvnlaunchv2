"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteBuscaSchema = exports.clienteCadastroSchema = void 0;
const zod_1 = require("zod");
exports.clienteCadastroSchema = zod_1.z.object({
    nomeCompleto: zod_1.z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
    email: zod_1.z
        .string()
        .email('E-mail inválido')
        .toLowerCase()
        .trim(),
    telefone: zod_1.z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
        .trim(),
    instagram: zod_1.z
        .string()
        .trim()
        .regex(/^@?[a-zA-Z0-9._]{1,30}$/, 'Instagram inválido')
        .transform(val => val.startsWith('@') ? val : `@${val}`),
    monetizacao: zod_1.z
        .string()
        .min(10, 'Descrição de monetização deve ter pelo menos 10 caracteres')
        .max(500, 'Descrição de monetização deve ter no máximo 500 caracteres')
        .trim()
});
exports.clienteBuscaSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('E-mail inválido')
        .toLowerCase()
        .trim()
});
