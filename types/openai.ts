// Tipos para a integração com a OpenAI

export interface OpenAIConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

export interface OpenAIRequestOptions {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface OpenAIStreamOptions extends OpenAIRequestOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (fullText: string) => void
}

// Tipos para os dados gerados pela IA

export interface Subnicho {
  id: string
  nome: string
  pesquisasMensais: number
  cpc: number
  palavrasChave: string[]
  termosPesquisa: string[]
  potencialRentabilidade: number
}

// Estrutura detalhada para a Persona
export interface PersonaDetalhada {
  perfilDemografico: {
    idade: string;
    genero: string;
    localizacao: string;
    escolaridade: string;
    renda: string;
    ocupacao: string;
  };
  comportamentoOnline: {
    tempoOnline: string;
    dispositivos: string;
    redesSociais: string; // Pode ser array de string se preferir lista
  };
  motivacoes: string[];
  pontosDeDor: string[];
  objetivos: string[];
  objecoesComuns: string[];
  canaisDeAquisicao: string[];
}

export interface ProdutoPrincipal {
  nome: string
  descricao: string
  persona: PersonaDetalhada
  valorVenda: number
  copyPaginaVendas: string
}

export interface OrderBump {
  nome: string
  descricao: string
  valorVenda: number
  problemaPrincipal?: string // Adicionado como opcional, conforme lógica de extração
}

export interface Upsell {
  nome: string
  descricao: string
  valorVenda: number
  copyPaginaVendas: string
}

export interface Downsell {
  nome: string
  descricao: string
  valorVenda: number
  copyPaginaVendas: string
}
