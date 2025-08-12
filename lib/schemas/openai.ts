import { z } from "zod";

// Schema Zod correspondente à interface Subnicho
export const subnichoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  pesquisasMensais: z.number(),
  cpc: z.number(),
  palavrasChave: z.array(z.string()),
  termosPesquisa: z.array(z.string()),
  potencialRentabilidade: z.number(),
});

// Schema Zod para PersonaDetalhada
export const personaDetalhadaSchema = z.object({
  perfilDemografico: z.object({
    idade: z.string(),
    genero: z.string(),
    localizacao: z.string(),
    escolaridade: z.string(),
    renda: z.string(),
    ocupacao: z.string(),
  }),
  comportamentoOnline: z.object({
    tempoOnline: z.string(),
    dispositivos: z.string(),
    redesSociais: z.string(), // Pode ser z.array(z.string()) se a API retornar array
  }),
  motivacoes: z.array(z.string()),
  pontosDeDor: z.array(z.string()),
  objetivos: z.array(z.string()),
  objecoesComuns: z.array(z.string()),
  canaisDeAquisicao: z.array(z.string()),
});

// Schema Zod para ProdutoPrincipal atualizado
export const produtoPrincipalSchema = z.object({
  nome: z.string(),
  descricao: z.string(),
  // Atualizado para usar o schema da persona estruturada
  persona: personaDetalhadaSchema,
  valorVenda: z.number(),
  copyPaginaVendas: z.string(),
});

// Schema Zod correspondente à interface OrderBump
export const orderBumpSchema = z.object({
  nome: z.string(),
  descricao: z.string(),
  valorVenda: z.number(),
  problemaPrincipal: z.string().optional(),
});

// Schema Zod correspondente à interface Upsell
export const upsellSchema = z.object({
  nome: z.string(),
  descricao: z.string(),
  valorVenda: z.number(),
  copyPaginaVendas: z.string(),
});

// Schema Zod correspondente à interface Downsell
export const downsellSchema = z.object({
  nome: z.string(),
  descricao: z.string(),
  valorVenda: z.number(),
  copyPaginaVendas: z.string(),
});

// Schema Zod para o produto completo, agregando todos os dados
export const produtoCompletoSchema = z.object({
  nicho: z.string().min(1, "Nicho é obrigatório"),
  subnicho: subnichoSchema, // Assumindo que o subnicho selecionado sempre estará presente
  produtoPrincipal: produtoPrincipalSchema, // Assumindo que o produto principal sempre estará presente
  orderBumps: z.array(orderBumpSchema).optional(), // Order bumps podem ser opcionais ou gerados depois
  upsell: upsellSchema.optional(), // Upsell pode ser opcional ou gerado depois
  downsell: downsellSchema.optional(), // Downsell pode ser opcional ou gerado depois
}); 