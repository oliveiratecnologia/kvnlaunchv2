"use server"

import { generateNichoContent, generateText } from "../openai-service"

/**
 * Exemplo de como usar o serviço OpenAI
 * Este arquivo é apenas para demonstração e não está conectado a nenhum componente
 */
export async function exampleOpenAIUsage() {
  try {
    // Exemplo 1: Gerar texto simples
    const simpleText = await generateText(
      "Quais são as 3 principais estratégias de marketing digital para produtos online?",
      "Você é um especialista em marketing digital. Seja conciso e direto.",
    )
    console.log("Texto gerado:", simpleText)

    // Exemplo 2: Gerar conteúdo específico para um nicho
    const nichoContent = await generateNichoContent("Marketing Digital")
    console.log("Conteúdo do nicho:", nichoContent)

    return {
      success: true,
      simpleText,
      nichoContent,
    }
  } catch (error) {
    console.error("Erro no exemplo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
