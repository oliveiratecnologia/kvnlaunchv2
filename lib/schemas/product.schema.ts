import { z } from 'zod'

const personaSchema = z.object({
  perfilDemografico: z.object({
    idade: z.string(),
    genero: z.string(),
    localizacao: z.string(),
    escolaridade: z.string(),
    renda: z.string(),
    ocupacao: z.string()
  }),
  comportamentoOnline: z.object({
    tempoOnline: z.string(),
    dispositivos: z.string(),
    redesSociais: z.string()
  }),
  motivacoes: z.array(z.string()).min(1),
  pontosDeDor: z.array(z.string()).min(1),
  objetivos: z.array(z.string()).min(1),
  objecoesComuns: z.array(z.string()).min(1),
  canaisDeAquisicao: z.array(z.string()).min(1)
})

const orderBumpSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
  valorVenda: z.number().positive(),
  problemaPrincipal: z.string().min(1)
})

const upsellDownsellSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
  valorVenda: z.number().positive(),
  copyPaginaVendas: z.string().min(1)
})

export const productCreateSchema = z.object({
  niche: z.string().min(1, 'Nicho é obrigatório'),
  sub_niche: z.string().min(1, 'Sub-nicho é obrigatório'),
  product_name: z.string().min(1, 'Nome do produto é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  sale_value: z.number().positive('Valor de venda deve ser positivo'),
  sales_copy: z.string().min(50, 'Copy de vendas deve ter pelo menos 50 caracteres'),
  persona: personaSchema,
  order_bumps: z.array(orderBumpSchema).optional().default([]),
  upsell: upsellDownsellSchema.optional(),
  downsell: upsellDownsellSchema.optional(),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active')
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateData = z.infer<typeof productCreateSchema>
export type ProductUpdateData = z.infer<typeof productUpdateSchema>