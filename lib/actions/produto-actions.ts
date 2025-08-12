"use server"

import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"
import type { ActionResponse } from "@/types/actions"

// Erros da aplicação
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
}

// Classe de erro personalizada
class AppError extends Error {
  code: string

  constructor(error: { code: string; message: string }) {
    super(error.message)
    this.code = error.code
  }
}

// Schema para criação/atualização de produto
const produtoSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().min(10).max(500),
  preco: z.number().min(0.01),
  categoria: z.string(),
  estoque: z.number().int().min(0),
})

// Schema para exclusão de produto
const deleteSchema = z.object({
  id: z.string(),
})

// Cliente de ações seguras
const action = createSafeActionClient()

// Ação para criar produto
export const criarProduto = action.schema(produtoSchema).action(async (input): Promise<ActionResponse> => {
  try {
    // Aqui seria implementada a lógica para criar o produto no banco de dados
    console.log("Criando produto:", input)

    // Simula um atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Retorna sucesso com dados simulados
    return {
      success: true,
      data: {
        id: Math.random().toString(36).substring(2, 9),
        ...input,
        dataCriacao: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    return {
      success: false,
      error: error instanceof AppError ? error : appErrors.FALHA_AO_CRIAR,
    }
  }
})

// Ação para atualizar produto
export const atualizarProduto = action
  .schema(produtoSchema.extend({ id: z.string() }))
  .action(async (input): Promise<ActionResponse> => {
    try {
      // Aqui seria implementada a lógica para atualizar o produto no banco de dados
      console.log("Atualizando produto:", input)

      // Simula um atraso de rede
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Retorna sucesso
      return { success: true, data: input }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      return {
        success: false,
        error: error instanceof AppError ? error : appErrors.FALHA_AO_ATUALIZAR,
      }
    }
  })

// Ação para excluir produto
export const excluirProduto = action.schema(deleteSchema).action(async (input): Promise<ActionResponse> => {
  try {
    // Aqui seria implementada a lógica para excluir o produto do banco de dados
    console.log("Excluindo produto:", input)

    // Simula um atraso de rede
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Retorna sucesso
    return { success: true }
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    return {
      success: false,
      error: error instanceof AppError ? error : appErrors.FALHA_AO_EXCLUIR,
    }
  }
})
