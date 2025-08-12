import { z } from 'zod'

export const clienteCadastroSchema = z.object({
  nomeCompleto: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  email: z
    .string()
    .email('E-mail inválido')
    .toLowerCase()
    .trim(),
  
  telefone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido')
    .trim(),
  
  instagram: z
    .string()
    .trim()
    .regex(/^@?[a-zA-Z0-9._]{1,30}$/, 'Instagram inválido')
    .transform(val => val.startsWith('@') ? val : `@${val}`),
  
  monetizacao: z
    .string()
    .min(10, 'Descrição de monetização deve ter pelo menos 10 caracteres')
    .max(500, 'Descrição de monetização deve ter no máximo 500 caracteres')
    .trim()
})

export const clienteBuscaSchema = z.object({
  email: z
    .string()
    .email('E-mail inválido')
    .toLowerCase()
    .trim()
})

export type ClienteCadastroData = z.infer<typeof clienteCadastroSchema>
export type ClienteBuscaData = z.infer<typeof clienteBuscaSchema>