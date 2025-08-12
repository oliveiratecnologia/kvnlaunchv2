export interface Cliente {
  id: string
  created_at: string
  nomeCompleto: string
  email: string
  telefone: string
  instagram: string
  monetizacao: string
  status: 'active' | 'inactive'
}

export interface ClienteCadastroData {
  nomeCompleto: string
  email: string
  telefone: string
  instagram: string
  monetizacao: string
}

export interface ClienteCadastroResponse {
  success: boolean
  clienteId: string
  message?: string
}
