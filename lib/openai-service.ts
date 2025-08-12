"use server"

import { OPENAI_API_KEY, OPENAI_API_URL, OPENAI_MAX_TOKENS, OPENAI_MODEL, OPENAI_TEMPERATURE, OPENAI_TIMEOUT, OPENAI_MAX_RETRIES } from "./openai-config"
// Importando os tipos definidos
import type { Subnicho, ProdutoPrincipal, OrderBump, Upsell, Downsell, PersonaDetalhada } from "@/types/openai"
// Importar rate limiter
import { rateLimiter } from "./rate-limiter"

// Tipos para as mensagens e respostas da OpenAI
export type OpenAIMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type OpenAIResponse = {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: OpenAIMessage
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Envia uma solicitação para a API da OpenAI com timeout e retry
 * @param messages Array de mensagens para enviar à API
 * @param retryCount Número de tentativas já realizadas
 * @returns A resposta da API da OpenAI
 */
export async function callOpenAI(messages: OpenAIMessage[], retryCount: number = 0): Promise<OpenAIResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não está definida")
  }

  // Criar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT);

  try {
    console.log(`[OpenAI] Tentativa ${retryCount + 1}/${OPENAI_MAX_RETRIES + 1} - Enviando requisição...`);
    
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: OPENAI_MAX_TOKENS,
        temperature: OPENAI_TEMPERATURE,
      }),
      signal: controller.signal, // Adiciona signal para timeout
    })

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json()
      const errorMessage = `Erro na API da OpenAI (${response.status}): ${JSON.stringify(errorData)}`;
      
      // Se for erro de rate limit (429) ou server error (5xx), tenta retry
      if ((response.status === 429 || response.status >= 500) && retryCount < OPENAI_MAX_RETRIES) {
        console.log(`[OpenAI] Erro ${response.status}, tentando novamente em 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Backoff exponencial
        return callOpenAI(messages, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[OpenAI] Requisição bem-sucedida! Tokens usados: ${result.usage?.total_tokens || 'N/A'}`);
    return result;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Se for timeout ou erro de rede, tenta retry
    if ((error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) && retryCount < OPENAI_MAX_RETRIES) {
      console.log(`[OpenAI] Timeout/erro de rede, tentando novamente em 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
      return callOpenAI(messages, retryCount + 1);
    }
    
    console.error("Erro ao chamar a API da OpenAI:", error);
    
    // Mensagem de erro mais amigável
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout: A API da OpenAI demorou mais que ${OPENAI_TIMEOUT/1000} segundos para responder. Tente novamente.`);
    }
    
    throw error;
  }
}

/**
 * Gera texto usando o modelo GPT-4o mini
 * @param prompt O prompt para gerar texto
 * @param systemPrompt Instruções de sistema (opcional)
 * @returns O texto gerado
 */
export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAIMessage[] = []

  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt,
    })
  }

  messages.push({
    role: "user",
    content: prompt,
  })

  try {
    // Estimar tokens (aproximação: 1 token ≈ 4 caracteres)
    const totalChars = (systemPrompt || '').length + prompt.length;
    const estimatedInputTokens = Math.ceil(totalChars / 4);
    const estimatedOutputTokens = 8000; // Estimativa para ebooks
    const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;

    console.log(`[OpenAI Service] Estimativa de tokens: ${totalEstimatedTokens} (input: ${estimatedInputTokens}, output: ${estimatedOutputTokens})`);

    // Aguardar disponibilidade do rate limiter
    await rateLimiter.waitForAvailability(totalEstimatedTokens);

    const response = await callOpenAI(messages)
    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("API da OpenAI retornou conteúdo vazio.")
    }

    console.log(`[OpenAI Service] Tokens reais usados: ${response.usage?.total_tokens || 'N/A'}`);
    return content
  } catch (error) {
    console.error("Erro ao gerar texto:", error)
    // Re-lança o erro para ser tratado pela função chamadora
    throw new Error(`Falha ao gerar texto: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Gera sugestões de nichos com base em um termo
 * @param termo Termo para gerar sugestões de nichos
 * @returns Array de sugestões de nichos
 * @throws {Error} Se a geração falhar.
 */
export async function generateNichoSuggestions(termo?: string): Promise<string[]> {
  const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais. 
  Forneça sugestões de nichos de mercado lucrativos para produtos digitais.`

  const prompt = termo
    ? `Gere 6 sugestões de nichos de mercado lucrativos relacionados a "${termo}".
       IMPORTANTE: Cada nicho deve ter no máximo 1 ou 2 palavras, sem hifens ou caracteres especiais.
       Exemplos corretos: "Emagrecimento", "Marketing Digital", "Investimentos", "Yoga", "Finanças".
       Exemplos incorretos: "Marketing - Digital", "Desenvolvimento Web e Mobile", "Estratégias de Emagrecimento".
       Retorne apenas os nomes dos nichos, um por linha, sem numeração ou explicações adicionais.`
    : `Gere 6 sugestões de nichos de mercado lucrativos para produtos digitais.
       IMPORTANTE: Cada nicho deve ter no máximo 1 ou 2 palavras, sem hifens ou caracteres especiais.
       Exemplos corretos: "Emagrecimento", "Marketing Digital", "Investimentos", "Yoga", "Finanças".
       Exemplos incorretos: "Marketing - Digital", "Desenvolvimento Web e Mobile", "Estratégias de Emagrecimento".
       Retorne apenas os nomes dos nichos, um por linha, sem numeração ou explicações adicionais.`

  try {
    const response = await generateText(prompt, systemPrompt)
    const suggestions = response.split("\n").filter((line) => line.trim() !== "")
    if (suggestions.length === 0) {
      throw new Error("Nenhuma sugestão de nicho foi gerada.")
    }
    return suggestions
  } catch (error) {
    console.error("Erro ao gerar sugestões de nichos:", error)
    // Remove fallback e lança erro
    throw new Error(`Falha ao gerar sugestões de nicho: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generates content for a given niche.
 * @param nicho The niche to generate content for.
 * @returns A string containing the generated content.
 * @throws {Error} Se a geração falhar.
 */
export async function generateNichoContent(nicho: string): Promise<string> {
  const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais.
  Crie conteúdo envolvente e informativo para o nicho especificado.`

  const prompt = `Gere um parágrafo curto e envolvente sobre o nicho de "${nicho}".
  O parágrafo deve destacar a importância do nicho e seu potencial para produtos digitais.
  Limite a resposta a 150 caracteres.`

  try {
    const response = await generateText(prompt, systemPrompt)
    if (!response) {
        throw new Error("Nenhum conteúdo de nicho foi gerado.")
    }
    return response
  } catch (error) {
    console.error("Erro ao gerar conteúdo do nicho:", error)
    // Remove fallback e lança erro
    throw new Error(`Falha ao gerar conteúdo do nicho: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Extrai objetos de subnicho válidos de uma string de texto
 * @param text Texto contendo possíveis objetos JSON
 * @returns Array de objetos de subnicho válidos
 */
function extrairSubnichosValidos(text: string): Subnicho[] {
  const subnichos: Subnicho[] = []
  let contador = 1

  // Expressão regular para encontrar objetos JSON
  const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  const matches = text.match(regex)

  if (!matches) return []

  for (const match of matches) {
    try {
      // Tenta analisar e validar o objeto contra a interface Subnicho
      const obj = JSON.parse(match) as Partial<Subnicho> // Cast inicial para verificação

      // Verificar se o objeto tem todas as propriedades necessárias
      if (
        obj.nome &&
        typeof obj.pesquisasMensais === "number" &&
        typeof obj.cpc === "number" &&
        Array.isArray(obj.palavrasChave) &&
        Array.isArray(obj.termosPesquisa) &&
        typeof obj.potencialRentabilidade === "number"
      ) {
        // Garantir que o objeto tenha um ID
        if (!obj.id) {
          obj.id = `subnicho_${contador}`
        }

        // Cast final após validação
        subnichos.push(obj as Subnicho)
        contador++

        // Limitar a 7 subnichos
        if (subnichos.length >= 7) break
      }
    } catch (e) {
      // Ignorar objetos que não podem ser analisados
      console.log("Erro ao analisar objeto de subnicho:", e)
    }
  }

  return subnichos
}

/**
 * Extrai objetos de order bump válidos de uma string de texto
 * @param text Texto contendo possíveis objetos JSON
 * @returns Array de objetos de order bump válidos
 */
function extrairOrderBumpsValidos(text: string): OrderBump[] {
  const orderBumps: OrderBump[] = []

  // Expressão regular melhorada para encontrar objetos JSON
  const regex = /\{[\s\S]*?(?:\{[\s\S]*?\}[\s\S]*?)*?\}/g
  const matches = text.match(regex)

  if (!matches) return []

  for (const match of matches) {
    try {
      // Limpar o texto para melhorar as chances de parsing bem-sucedido
      const cleanedMatch = match
        .replace(/(\w+):/g, '"$1":') // Adicionar aspas em chaves sem aspas
        .replace(/:\s*'([^']*)'/g, ':"$1"') // Converter aspas simples em aspas duplas
        .replace(/,\s*}/g, "}") // Remover vírgulas no final de objetos
        .replace(/,\s*]/g, "]") // Remover vírgulas no final de arrays

      // Tenta analisar e validar o objeto contra a interface OrderBump
      const obj = JSON.parse(cleanedMatch) as Partial<OrderBump> // Cast inicial

      // Verificar se o objeto tem todas as propriedades necessárias
      if (obj.nome && obj.descricao && (typeof obj.valorVenda === "number" || obj.valorVenda === 9.9)) {
        // Garantir que valorVenda seja um número
        if (typeof obj.valorVenda !== "number") {
          obj.valorVenda = 9.9
        }

        // Adicionar problemaPrincipal se não existir (opcional)
        if (!obj.problemaPrincipal) {
          obj.problemaPrincipal = `Dificuldade específica relacionada a ${obj.nome}`
        }

        // Cast final após validação
        orderBumps.push(obj as OrderBump)

        // Limitar a 5 order bumps
        if (orderBumps.length >= 5) break
      }
    } catch (e) {
      // Ignorar objetos que não podem ser analisados
      console.log("Erro ao analisar objeto de order bump:", e)
    }
  }

  return orderBumps
}

/**
 * Gera subnichos com base em um nicho principal
 * @param nicho Nicho principal
 * @returns Array de objetos de subnicho
 * @throws {Error} Se a geração falhar ou não encontrar subnichos suficientes.
 */
export async function generateSubnichos(nicho: string): Promise<Subnicho[]> {
  const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais.
  Forneça informações detalhadas sobre subnichos de mercado para o nicho principal fornecido.
  IMPORTANTE: Sua resposta deve conter objetos JSON válidos.`

  const prompt = `Gere 7 subnichos lucrativos e específicos para o nicho de "${nicho}".
  Para cada subnicho, forneça as seguintes informações em formato JSON:
  {
    "id": "subnicho_X",
    "nome": "Nome do Subnicho",
    "pesquisasMensais": 10000,
    "cpc": 3.5,
    "palavrasChave": ["palavra1", "palavra2", "palavra3"],
    "termosPesquisa": ["termo1", "termo2", "termo3"],
    "potencialRentabilidade": 85
  }
  
  IMPORTANTE: 
  - Gere exatamente 7 subnichos
  - Cada objeto deve ter TODAS as propriedades listadas
  - Use apenas JSON válido, sem comentários
  - Valores numéricos sem aspas
  
  Retorne 7 objetos JSON válidos.`

  try {
    const response = await generateText(prompt, systemPrompt)
    console.log("Resposta da API (primeiros 200 caracteres):", response.substring(0, 200) + "...")

    const subnichos = extrairSubnichosValidos(response)

    // Mínimo de 3 subnichos necessários
    const MIN_SUBNICHOS = 3
    if (subnichos.length < MIN_SUBNICHOS) {
      // Lança erro em vez de usar fallback
      throw new Error(`Falha ao extrair subnichos válidos suficientes (encontrados: ${subnichos.length}, mínimo: ${MIN_SUBNICHOS}). Resposta da API: ${response.substring(0, 500)}...`)
    }

      console.log(`Extraídos ${subnichos.length} subnichos válidos.`)
      return subnichos

  } catch (error) {
    console.error("Erro ao gerar subnichos:", error)
    // Remove fallback e lança erro
    throw new Error(`Falha ao gerar subnichos para '${nicho}': ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Verifica se um produto gerado atende aos critérios de qualidade
 * @param produto Produto gerado (com persona estruturada)
 * @param nichoNome Nome do nicho
 * @returns Boolean indicando se o produto atende aos critérios
 */
function verificarQualidadeProduto(produto: ProdutoPrincipal, nichoNome: string): boolean {
  const nomeContemNicho = produto.nome?.toLowerCase().includes(nichoNome.toLowerCase());
  const descricaoContemNicho = produto.descricao?.toLowerCase().split("\n\n").every((p) => p.includes(nichoNome.toLowerCase()));
  // Verifica se a persona tem as seções principais
  const personaValida = produto.persona &&
                        produto.persona.perfilDemografico &&
                        produto.persona.motivacoes &&
                        produto.persona.pontosDeDor &&
                        produto.persona.objetivos;
  const valorVendaCorreto = produto.valorVenda === 47.0;

  console.log(`Verificação de qualidade para "${nichoNome}":`);
  console.log(`- Nome contém nicho: ${!!nomeContemNicho}`);
  console.log(`- Descrição contém nicho: ${!!descricaoContemNicho}`);
  console.log(`- Persona válida (estrutura básica): ${!!personaValida}`);
  console.log(`- Valor de venda correto: ${!!valorVendaCorreto}`);

  return !!(nomeContemNicho && descricaoContemNicho && personaValida && valorVendaCorreto);
}

/**
 * Gera um produto principal com base no nicho e subnicho
 * @param nicho Nicho principal
 * @param subnicho Subnicho selecionado
 * @returns Objeto do produto principal
 * @throws {Error} Se a geração falhar após as tentativas.
 */
export async function generateProdutoPrincipal(nicho: string, subnicho: any): Promise<ProdutoPrincipal> {
  const nichoNome = subnicho?.nome || nicho;
  const palavrasChave = subnicho?.palavrasChave || [];
  const termosPesquisa = subnicho?.termosPesquisa || [];
  const potencialRentabilidade = subnicho?.potencialRentabilidade || 80;

  const systemPrompt = `Você é um estrategista digital especializado em criação de ebooks digitais de alta conversão, com um faturamento comprovado de 100 milhões de dólares em marketing digital.
Sua principal habilidade é criar ebooks digitais de alta demanda que resolvem problemas de maneiras únicas através de conteúdo textual estruturado, guias práticos e materiais de leitura digital.
Mentorado por gigantes do marketing digital como Alex Hormozi, Dan Kennedy e Gary Halbert, você se destaca por desenvolver ebooks digitais que são inovadores, práticos e irresistíveis.
Você vai usar todas suas habilidades para criar um ebook digital de alta conversão para o nicho específico de "${nichoNome}".

IMPORTANTE: Todos os produtos devem ser estruturados como EBOOKS DIGITAIS (conteúdo em formato PDF/digital para leitura), organizados em capítulos/módulos de conteúdo textual, guias práticos, estratégias escritas e materiais informativos.`

  const prompt = `Crie os detalhes de um EBOOK DIGITAL para o nicho específico de "${nichoNome}".

O produto deve ser estruturado como um EBOOK DIGITAL (formato PDF/digital) com conteúdo textual organizado em capítulos/módulos, contendo:
- Guias práticos e estratégias escritas
- Conteúdo informativo e educacional
- Métodos e técnicas explicados passo a passo
- Materiais de referência e consulta
- Estrutura de leitura sequencial ou por tópicos

IMPORTANTE: NÃO inclua a palavra "Ebook" no nome do produto. Use nomes atraentes e profissionais que indiquem o benefício ou resultado.

EVITE sugerir outros formatos como:
- Cursos em vídeo
- Mentorias
- Planilhas como produto principal
- Softwares ou aplicativos
- Serviços de consultoria

Foque exclusivamente em conteúdo textual digital estruturado para leitura.

Forneça as seguintes informações em formato JSON:
{
  "nome": "...",
  "descricao": "...",
  "persona": {
    "perfilDemografico": {
      "idade": "PREENCHER Faixa etária (ex: 30-45 anos)",
      "genero": "PREENCHER Distribuição (ex: 55% homens, 45% mulheres)",
      "localizacao": "PREENCHER Principal localização (ex: Capitais e grandes cidades)",
      "escolaridade": "PREENCHER Nível de escolaridade (ex: Ensino superior completo (65%))",
      "renda": "PREENCHER Faixa de renda (ex: R$ 5.000 a R$ 12.000 mensais)",
      "ocupacao": "PREENCHER Principais ocupações (ex: Profissionais liberais, empreendedores)"
    },
    "comportamentoOnline": {
      "tempoOnline": "PREENCHER Tempo médio online (ex: 3-5 horas diárias)",
      "dispositivos": "PREENCHER Dispositivos mais usados (ex: Smartphone (65%), notebook (30%))",
      "redesSociais": "PREENCHER Redes sociais mais usadas (ex: Instagram, LinkedIn, YouTube)"
    },
    "motivacoes": [
      "PREENCHER Motivação 1 relacionada a ${nichoNome}",
      "PREENCHER Motivação 2 relacionada a ${nichoNome}",
      "PREENCHER Motivação 3"
    ],
    "pontosDeDor": [
      "PREENCHER Ponto de dor 1 específico de ${nichoNome}",
      "PREENCHER Ponto de dor 2 específico de ${nichoNome}",
      "PREENCHER Ponto de dor 3"
    ],
    "objetivos": [
      "PREENCHER Objetivo 1 relacionado a ${nichoNome}",
      "PREENCHER Objetivo 2 relacionado a ${nichoNome}",
      "PREENCHER Objetivo 3"
    ],
    "objecoesComuns": [
      "PREENCHER Objeção 1 sobre o produto/nicho",
      "PREENCHER Objeção 2 sobre o produto/nicho",
      "PREENCHER Objeção 3"
    ],
    "canaisDeAquisicao": [
      "PREENCHER Canal de aquisição 1 (ex: Anúncios em redes sociais)",
      "PREENCHER Canal de aquisição 2 (ex: Marketing de conteúdo)",
      "PREENCHER Canal de aquisição 3"
    ]
  },
  "valorVenda": 47.0
}

IMPORTANTE:
1. O produto DEVE ser 100% específico para "${nichoNome}" e estruturado como EBOOK DIGITAL.
2. O nome do produto NÃO deve conter a palavra "Ebook" - use nomes atraentes que indiquem o benefício.
3. A descrição deve deixar claro que é um guia digital/manual prático em formato de leitura.
4. O campo "persona" DEVE ser um objeto JSON com TODAS as subchaves e arrays especificados.
5. **TODOS OS CAMPOS dentro de 'persona' (incluindo idade, genero, etc. e os arrays) DEVEM ser preenchidos com conteúdo relevante**, não deixe strings vazias ou placeholders como 'PREENCHER...'.
6. **GERAR UM JSON PERFEITAMENTE VÁLIDO.** Verifique vírgulas e aspas.
7. Retorne APENAS o objeto JSON válido completo.`

  try {
    let tentativas = 0;
    const maxTentativas = 3;
    let lastError: any = null;

    while (tentativas < maxTentativas) {
      try {
        console.log(`[Tentativa ${tentativas + 1}/${maxTentativas}] Gerando produto para "${nichoNome}"`);
        const response = await generateText(prompt, systemPrompt);
        console.log(`[Tentativa ${tentativas + 1}] Resposta bruta da API (início):`, response.substring(0, 300) + "...");

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log(`[Tentativa ${tentativas + 1}] JSON não encontrado na resposta.`);
            lastError = new Error("JSON não encontrado na resposta da API");
            tentativas++;
            continue;
        }

        let produtoParcial: Omit<ProdutoPrincipal, 'copyPaginaVendas'>; // Usa Omit pois a copy não vem mais daqui
        let jsonString = jsonMatch[0];

        try {
             jsonString = jsonString.replace(/,\s*(}|])/g, "$1");
             // Parse para o tipo parcial (sem copy)
             produtoParcial = JSON.parse(jsonString) as Omit<ProdutoPrincipal, 'copyPaginaVendas'>;

             // Adiciona a copy vazia temporariamente para validação (ou remove a validação da copy)
             const produtoParaValidar = { ...produtoParcial, copyPaginaVendas: "" } as ProdutoPrincipal;

             // A validação de qualidade precisa ser ajustada ou remover a checagem da copy
             // Simplificando a validação por agora:
             const qualidadeOk = produtoParaValidar.nome && produtoParaValidar.descricao && produtoParaValidar.persona && produtoParaValidar.valorVenda === 47.0;
             console.log(`[Tentativa ${tentativas + 1}] Verificação de Qualidade (Simplificada): ${qualidadeOk}`);

             if (qualidadeOk) {
                console.log(`Detalhes do produto principal gerados com sucesso para "${nichoNome}"!`);
                // Retorna o objeto PARCIAL (sem a copy)
                // A copy será gerada em outra função.
                // Precisamos ajustar o tipo de retorno ou a forma como usamos.
                // Temporariamente, vamos retornar com copy vazia, mas idealmente seria ajustar o tipo.
                 return { ...produtoParcial, copyPaginaVendas: "" }; // Retorna com copy vazia por enquanto
             }
             console.log(`[Tentativa ${tentativas + 1}] Produto não passou na verificação de qualidade.`);
             lastError = new Error("Produto gerado não atendeu aos critérios de qualidade.");
            tentativas++;
        } catch (parseError) {
            console.error(`[Tentativa ${tentativas + 1}] Erro ao parsear JSON:`, parseError);
            // Logar o JSON *antes* da tentativa de limpeza e *depois* se for diferente
            console.log(`[Tentativa ${tentativas + 1}] JSON inválido (bruto):`, jsonMatch[0].substring(0, 500) + "...");
            if (jsonString !== jsonMatch[0]) {
                 console.log(`[Tentativa ${tentativas + 1}] JSON após limpeza (ainda inválido):`, jsonString.substring(0, 500) + "...");
            }
            lastError = parseError;
            tentativas++;
        }

      } catch (innerError) {
          // Captura erros dentro do loop try (ex: falha em generateText)
          console.error(`[Tentativa ${tentativas + 1}] Erro interno no loop:`, innerError);
          lastError = innerError;
          tentativas++;
      }
    } // Fim do while

    // Se chegou aqui, todas as tentativas falharam
    console.error(`Falha ao gerar produto principal para '${nichoNome}' após ${maxTentativas} tentativas. Último erro:`, lastError);
    throw new Error(`Falha ao gerar produto principal após ${maxTentativas} tentativas. Último erro: ${lastError instanceof Error ? lastError.message : String(lastError)}`);

  } catch (error) {
      // Captura erros fora do loop (ex: erro inicial)
      console.error(`Erro GERAL ao gerar produto principal para '${nichoNome}':`, error);
      throw new Error(`Falha na geração do produto principal: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gera order bumps com base no nicho, subnicho e produto principal
 * @param nicho Nicho principal
 * @param subnicho Subnicho selecionado (mantido como 'any')
 * @param produtoPrincipal Produto principal (mantido como 'any')
 * @returns Array de objetos de order bump
 * @throws {Error} Se a geração falhar ou não encontrar order bumps suficientes.
 */
export async function generateOrderBumps(nicho: string, subnicho: any, produtoPrincipal: any): Promise<OrderBump[]> {
  const nichoNome = subnicho?.nome || nicho
  const produtoNome = produtoPrincipal?.nome || `Guia Completo de ${nichoNome}`
  const produtoDescricao = produtoPrincipal?.descricao || ""

  // Log para diagnóstico de problema com copyPaginaVendas
  console.log(`[generateOrderBumps] Verificando dados de entrada:
    - Nome do produto: ${produtoNome}
    - Tem copyPaginaVendas: ${!!produtoPrincipal?.copyPaginaVendas}
    - Tipo de copyPaginaVendas: ${typeof produtoPrincipal?.copyPaginaVendas}
    - Tamanho da copyPaginaVendas: ${produtoPrincipal?.copyPaginaVendas?.length || 0}
    - Tem persona: ${!!produtoPrincipal?.persona}`);

  try {
    // Extrair informações relevantes do produto principal, com tratamento de erros
    const modulos = extrairModulos(produtoPrincipal?.copyPaginaVendas || "")
    const pontosDor = extrairPontosDor(JSON.stringify(produtoPrincipal?.persona) || "")
    const objetivos = extrairObjetivos(JSON.stringify(produtoPrincipal?.persona) || "")

    const systemPrompt = `Você é um especialista em criação de produtos digitais complementares (order bumps) para ebooks digitais no nicho específico de "${nichoNome}".
Sua tarefa é criar order bumps que sejam EXTENSÕES DIRETAS do ebook principal "${produtoNome}".
Cada order bump deve ser um complemento digital que melhora a experiência de leitura e aplicação do ebook principal.
Os order bumps devem ser materiais digitais complementares (PDFs, planilhas, templates, checklists) que fazem sentido APENAS quando usados junto com o ebook principal.

FOCO EM EBOOKS: Todos os complementos devem ser adequados para quem está lendo um ebook digital e quer aplicar o conteúdo na prática.`

    const prompt = `Crie 5 order bumps que sejam COMPLEMENTOS DIGITAIS DIRETOS para o ebook "${produtoNome}".

INFORMAÇÕES SOBRE O EBOOK PRINCIPAL:
- Nome: "${produtoNome}"
- Descrição: "${produtoDescricao}"
- Módulos/Capítulos: ${modulos}
- Pontos de dor que resolve: ${pontosDor}
- Objetivos do cliente: ${objetivos}

DIRETRIZES PARA OS ORDER BUMPS (COMPLEMENTOS DIGITAIS):
1. Cada order bump deve ser um COMPLEMENTO DIGITAL DIRETO do ebook principal
2. Cada order bump deve FACILITAR A APLICAÇÃO PRÁTICA do conteúdo do ebook
3. Preço de cada order bump: R$ 9,90
4. Cada order bump deve ser um material digital que resolve um problema específico de implementação
5. Os order bumps devem ser "ferramentas práticas" que maximizam o sucesso com o ebook

TIPOS DE COMPLEMENTOS DIGITAIS IDEAIS PARA EBOOKS (adapte para ${nichoNome}):
- Planilhas específicas para implementar estratégias do ebook
- Checklists de implementação dos capítulos do ebook
- Templates digitais mencionados ou relacionados ao ebook
- Calculadoras ou ferramentas que aceleram a aplicação do método do ebook
- Guias rápidos que complementam capítulos específicos do ebook
- Worksheets para exercícios práticos baseados no ebook

EVITE:
- Cursos em vídeo
- Mentorias ou consultoria
- Produtos físicos
- Softwares complexos

Para cada order bump, forneça as seguintes informações em formato JSON:
{
  "nome": "Nome específico que demonstra a conexão com o produto principal",
  "descricao": "Descrição que explica EXATAMENTE como este recurso complementa o produto principal e por que é valioso quando usado em conjunto",
  "valorVenda": 9.9,
  "problemaPrincipal": "O problema específico que este order bump resolve quando usado junto com o produto principal"
}

IMPORTANTE:
1. Cada objeto deve ter TODAS as propriedades listadas acima.
2. Certifique-se de que cada objeto JSON seja válido individualmente.
3. Não use vírgulas após o último item de cada objeto.
4. Os order bumps devem ser MATERIAIS DIGITAIS ESPECÍFICOS para ${nichoNome} e DIRETAMENTE CONECTADOS ao ebook.
5. Cada order bump deve ser uma FERRAMENTA PRÁTICA DIGITAL que facilita a aplicação do ebook.
6. NÃO crie order bumps genéricos - eles devem ser específicos para implementar o conteúdo de "${produtoNome}".
7. Foque em materiais que um leitor de ebook precisaria para colocar o conhecimento em prática.

Retorne 5 objetos JSON válidos, um para cada order bump digital.`

    let tentativas = 0
    const maxTentativas = 3 // Adicionando tentativas para order bumps
    const MIN_ORDER_BUMPS = 2 // Exigir pelo menos 2 válidos

    while(tentativas < maxTentativas) {
        console.log(`Tentativa ${tentativas + 1} de gerar order bumps para "${nichoNome}"`);
        const response = await generateText(prompt, systemPrompt)
        console.log("Resposta da API (order bumps - primeiros 200):", response.substring(0, 200) + "...")

        const orderBumps = extrairOrderBumpsValidos(response)

        if (orderBumps.length >= MIN_ORDER_BUMPS) {
            console.log(`Extraídos ${orderBumps.length} order bumps válidos.`)
            return orderBumps.slice(0, 5) // Limita a 5 como na extração
        }

        console.log(`Order bumps gerados (${orderBumps.length}) insuficientes (mínimo ${MIN_ORDER_BUMPS}), tentando novamente...`)
          tentativas++
    }

    // Se todas as tentativas falharem
    throw new Error(`Falha ao gerar order bumps suficientes para '${nichoNome}' após ${maxTentativas} tentativas.`)

  } catch (error) {
    console.error("Erro ao gerar order bumps:", error)
     // Remove fallback e lança erro
    throw new Error(`Falha na geração de order bumps para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Extrai pontos de dor do texto da persona.
 * @param personaText Texto da persona.
 * @returns String com pontos de dor ou mensagem padrão.
 */
function extrairPontosDor(personaText: string): string {
  if (!personaText || typeof personaText !== 'string') {
    console.warn("extrairPontosDor: personaText é indefinido ou não é uma string");
    return "Frustração com métodos tradicionais, excesso de informação desorganizada, dificuldade em encontrar estratégias práticas";
  }

  try {
    // Primeiro tenta extrair de um objeto JSON (se for passed como JSON.stringify)
    try {
      const personaObj = JSON.parse(personaText);
      if (personaObj && personaObj.pontosDeDor && Array.isArray(personaObj.pontosDeDor)) {
        return personaObj.pontosDeDor.join(", ");
      }
    } catch (jsonError) {
      // Se não for um JSON válido, continue com a abordagem baseada em texto
      console.log("Não foi possível parsear personaText como JSON, tentando extração de texto");
    }

    // Abordagem baseada em texto (fallback)
    const pontosDorMatch = personaText.match(/\*\*Pontos de Dor:\*\*([\s\S]*?)(?:\*\*\w|$)/i);
    if (pontosDorMatch && pontosDorMatch[1]) {
      return pontosDorMatch[1].trim();
    }
  } catch (error) {
    console.error("Erro ao extrair pontos de dor:", error);
  }

  return "Frustração com métodos tradicionais, excesso de informação desorganizada, dificuldade em encontrar estratégias práticas";
}

/**
 * Extrai módulos do texto da copy de vendas.
 * @param copyText Texto da copy.
 * @returns String com módulos ou mensagem padrão.
 */
function extrairModulos(copyText: string): string {
  // Verificar se copyText está definido
  if (!copyText || typeof copyText !== 'string') {
    console.warn("extrairModulos: copyText é indefinido ou não é uma string");
    return "Capítulos estruturados com conteúdo prático e aplicável";
  }

  try {
    // Tentar encontrar seções que descrevem módulos, capítulos ou conteúdo do ebook
    const modulosMatch =
      copyText.match(/O QUE VOCÊ VAI ENCONTRAR[\s\S]*?(?:###|$)/i) ||
      copyText.match(/MÓDULO[\s\S]*?(?:###|$)/i) ||
      copyText.match(/CAPÍTULO[\s\S]*?(?:###|$)/i) ||
      copyText.match(/CONTEÚDO[\s\S]*?(?:###|$)/i);

    if (modulosMatch && modulosMatch[0]) {
      return modulosMatch[0].trim();
    }
  } catch (error) {
    console.error("Erro ao extrair módulos da copy:", error);
  }

  return "Capítulos estruturados com conteúdo prático e aplicável para leitura digital";
}

/**
 * Extrai objetivos do texto da persona.
 * @param personaText Texto da persona.
 * @returns String com objetivos ou mensagem padrão.
 */
function extrairObjetivos(personaText: string): string {
  if (!personaText || typeof personaText !== 'string') {
    console.warn("extrairObjetivos: personaText é indefinido ou não é uma string");
    return "Dominar o tema, aplicar conhecimentos práticos, economizar tempo e recursos";
  }

  try {
    // Primeiro tenta extrair de um objeto JSON (se for passed como JSON.stringify)
    try {
      const personaObj = JSON.parse(personaText);
      if (personaObj && personaObj.objetivos && Array.isArray(personaObj.objetivos)) {
        return personaObj.objetivos.join(", ");
      }
    } catch (jsonError) {
      // Se não for um JSON válido, continue com a abordagem baseada em texto
      console.log("Não foi possível parsear personaText como JSON, tentando extração de texto");
    }

    // Abordagem baseada em texto (fallback)
    const objetivosMatch = personaText.match(/\*\*Objetivos:\*\*([\s\S]*?)(?:\*\*\w|$)/i);
    if (objetivosMatch && objetivosMatch[1]) {
      return objetivosMatch[1].trim();
    }
  } catch (error) {
    console.error("Erro ao extrair objetivos:", error);
  }

  return "Dominar o tema, aplicar conhecimentos práticos, economizar tempo e recursos";
}

/**
 * Gera um upsell com base no nicho, subnicho e produto principal
 * @param nicho Nicho principal
 * @param subnicho Subnicho selecionado (mantido como 'any')
 * @param produtoPrincipal Produto principal (mantido como 'any')
 * @returns Objeto do upsell
 * @throws {Error} Se a geração falhar após as tentativas.
 */
export async function generateUpsell(nicho: string, subnicho: any, produtoPrincipal: any): Promise<Upsell> {
  const nichoNome = subnicho?.nome || nicho

  const systemPrompt = `Você é um especialista em marketing digital e criação de ebooks digitais premium.
  Crie um upsell que seja um EBOOK PREMIUM mais avançado e completo que complementa o ebook principal.`

  const prompt = `Crie um upsell que seja um EBOOK PREMIUM mais avançado para complementar o ebook principal "${produtoPrincipal?.nome || `Guia Completo de ${nichoNome}`}".

  O upsell deve ser um EBOOK DIGITAL PREMIUM com:
  - Conteúdo mais avançado e aprofundado
  - Estratégias premium e técnicas exclusivas
  - Casos de estudo e exemplos detalhados
  - Métodos avançados não cobertos no ebook básico
  - Estrutura de capítulos mais robusta

  IMPORTANTE: NÃO inclua a palavra "Ebook" no nome. Use um nome atrativo que indique o nível premium.
  O preço deve ser R$ 97,00.

  Forneça as seguintes informações em formato JSON:
  - nome: nome atrativo do ebook premium (string) - SEM a palavra "Ebook"
  - descricao: descrição detalhada explicando que é um guia digital premium mais avançado (2-3 parágrafos)
  - valorVenda: 97.0 (número)
  - copyPaginaVendas: texto completo para uma página de vendas persuasiva do ebook premium (string)
  
  IMPORTANTE:
  - Na copyPaginaVendas, use apenas texto puro, sem formatação Markdown
  - Não use símbolos como #, ##, **, ***, ou qualquer outra marcação em todo o texto
  - Não use prefixos numerados como "1. " ou "2. " no início das linhas
  - Separe as seções com quebras de linha simples
  
  Retorne apenas um objeto JSON válido, sem explicações adicionais.`

  try {
    let tentativas = 0
    const maxTentativas = 3

    while (tentativas < maxTentativas) {
      console.log(`Tentativa ${tentativas + 1} de gerar upsell para "${nichoNome}"`);
    const response = await generateText(prompt, systemPrompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
        try {
          // Cast para Upsell
          const upsellData = JSON.parse(jsonMatch[0])
          
          // Limpar formatação Markdown da copy
          if (upsellData.copyPaginaVendas) {
            upsellData.copyPaginaVendas = upsellData.copyPaginaVendas
              .replace(/^#+ /gm, '') // Remove # no início das linhas
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** (negrito)
              .replace(/\*(.*?)\*/g, '$1') // Remove * (itálico)
              .replace(/^- /gm, '') // Remove - no início das linhas (listas)
              .replace(/^> /gm, '') // Remove > no início das linhas (citações)
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links Markdown
              .replace(/\n\s*\n\s*\n/g, '\n\n') // Reduz múltiplas quebras de linha para no máximo 2
          }
          
          const upsell = upsellData as Upsell

          // Verificação de qualidade básica
          if (upsell.nome && upsell.descricao && upsell.copyPaginaVendas && upsell.valorVenda === 97.0) {
              console.log(`Upsell gerado com sucesso para ${nichoNome}.`)
              return upsell
          }
           console.log("Upsell gerado não passou na verificação de qualidade, tentando novamente...")
        } catch(e){
             console.error("Erro ao analisar JSON do Upsell na tentativa", e)
        }
      }
      tentativas++
    }

    // Se todas as tentativas falharem
    throw new Error(`Falha ao gerar upsell para '${nichoNome}' após ${maxTentativas} tentativas.`)

  } catch (error) {
    console.error("Erro ao gerar upsell:", error)
     // Remove fallback e lança erro
    throw new Error(`Falha na geração do upsell para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Gera um downsell com base no nicho, subnicho, produto principal e upsell
 * @param nicho Nicho principal
 * @param subnicho Subnicho selecionado
 * @param produtoPrincipal Produto principal
 * @param upsell Upsell
 * @returns Objeto do downsell
 * @throws {Error} Se a geração falhar após as tentativas.
 */
export async function generateDownsell(
  nicho: string,
  subnicho: any,
  produtoPrincipal: any,
  upsell: any
): Promise<Downsell> {
  const nichoNome = subnicho?.nome || nicho;

  // Log para diagnóstico
  console.log(`[generateDownsell] Verificando dados de entrada:
    - Nome do produto principal: ${produtoPrincipal?.nome || 'N/A'}
    - Nome do upsell: ${upsell?.nome || 'N/A'}
    - Nicho/Subnicho: ${nichoNome}`);

  const systemPrompt = `Você é um especialista em marketing digital e criação de ebooks digitais acessíveis.
  Crie um downsell que seja um EBOOK DIGITAL mais simples e acessível para oferecer após a recusa de um upsell.`;

  const prompt = `Crie um downsell que seja um EBOOK DIGITAL mais simples e acessível para oferecer após a recusa do upsell "${upsell?.nome || `Guia Avançado de ${nichoNome}`}".

  O downsell deve ser um EBOOK DIGITAL SIMPLIFICADO com:
  - Conteúdo essencial e direto ao ponto
  - Estratégias básicas mas eficazes
  - Formato mais enxuto e fácil de consumir
  - Foco nos pontos mais importantes do tema
  - Preço acessível de R$ 27,00

  IMPORTANTE: NÃO inclua a palavra "Ebook" no nome. Use um nome atrativo que indique simplicidade e acessibilidade.

  Forneça as seguintes informações em formato JSON:
  - nome: nome atrativo do ebook simplificado (string) - SEM a palavra "Ebook"
  - descricao: descrição detalhada explicando que é um guia digital simplificado e acessível (2-3 parágrafos)
  - valorVenda: 27.0 (número)
  - copyPaginaVendas: texto completo para uma página de vendas persuasiva do ebook simplificado (string)
  
  IMPORTANTE:
  - Na copyPaginaVendas, use apenas texto puro, sem formatação Markdown
  - Não use símbolos como #, ##, **, ***, ou qualquer outra marcação em todo o texto
  - Não use prefixos numerados como "1. " ou "2. " no início das linhas
  - Separe as seções com quebras de linha simples
  
  Retorne apenas um objeto JSON válido, sem explicações adicionais.`;

  try {
    let tentativas = 0;
    const maxTentativas = 3;

    while (tentativas < maxTentativas) {
      console.log(`Tentativa ${tentativas + 1} de gerar downsell para "${nichoNome}"`);
      const response = await generateText(prompt, systemPrompt);
      console.log("Resposta da API (downsell - primeiros 200 chars):", response.substring(0, 200) + "...");
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          // Parse do JSON
          const downsellData = JSON.parse(jsonMatch[0]);
          
          // Limpar formatação Markdown da copy
          if (downsellData.copyPaginaVendas) {
            downsellData.copyPaginaVendas = downsellData.copyPaginaVendas
              .replace(/^#+ /gm, '') // Remove # no início das linhas
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** (negrito)
              .replace(/\*(.*?)\*/g, '$1') // Remove * (itálico)
              .replace(/^- /gm, '') // Remove - no início das linhas (listas)
              .replace(/^> /gm, '') // Remove > no início das linhas (citações)
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links Markdown
              .replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduz múltiplas quebras de linha para no máximo 2
          }
          
          // Cast para Downsell
          const downsell = downsellData as Downsell;
          
          console.log(`[Tentativa ${tentativas + 1}] Downsell parseado: 
            Nome: ${downsell.nome || 'N/A'} 
            Valor: ${downsell.valorVenda || 'N/A'}
            Tem descrição: ${!!downsell.descricao}
            Tem copy: ${!!downsell.copyPaginaVendas}`);

          // Verificação de qualidade básica
          if (downsell.nome && downsell.descricao && downsell.copyPaginaVendas && downsell.valorVenda === 27.0) {
            console.log(`Downsell gerado com sucesso para ${nichoNome}.`);
            return downsell;
          }
          
          console.log("Downsell gerado não passou na verificação de qualidade. Razões:", 
            !downsell.nome ? "Nome ausente" : "",
            !downsell.descricao ? "Descrição ausente" : "",
            !downsell.copyPaginaVendas ? "Copy ausente" : "",
            downsell.valorVenda !== 27.0 ? `Valor incorreto (${downsell.valorVenda} em vez de 27.0)` : ""
          );
        } catch(e) {
          console.error("Erro ao analisar JSON do Downsell na tentativa:", e);
        }
      }
      tentativas++;
    }

    // Se todas as tentativas falharem
    throw new Error(`Falha ao gerar downsell para '${nichoNome}' após ${maxTentativas} tentativas.`);
  } catch (error) {
    console.error("Erro ao gerar downsell:", error);
    // Remove fallback e lança erro
    throw new Error(`Falha na geração do downsell para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`);
  }
}

// **** NOVA FUNÇÃO para gerar APENAS a copy ****
export async function generateCopyPaginaVendas(
    produtoInfo: Omit<ProdutoPrincipal, 'copyPaginaVendas'>
): Promise<string> {

    // Exemplo simplificado de extração, pode precisar de mais contexto se subnicho não estiver em produtoInfo
    const nichoNome = produtoInfo.persona?.perfilDemografico?.ocupacao?.includes("Empreendedores") ? produtoInfo.nome : "seu nicho";

    const systemPrompt = `Você é um copywriter expert em páginas de vendas de alta conversão para ebooks digitais, seguindo princípios de Alex Hormozi e Gary Halbert.
Especializado em vender ebooks digitais (guias em PDF) que resolvem problemas específicos através de conteúdo textual estruturado.`;

    const prompt = `Crie o texto completo para uma página de vendas persuasiva para o seguinte EBOOK DIGITAL focado em '${nichoNome}':

EBOOK DIGITAL: ${produtoInfo.nome}
Descrição: ${produtoInfo.descricao}
Persona Alvo (resumo): Idade ${produtoInfo.persona?.perfilDemografico?.idade}, busca resolver ${produtoInfo.persona?.pontosDeDor?.[0] || 'problemas específicos'}, objetivo ${produtoInfo.persona?.objetivos?.[0] || 'alcançar resultados'}.
Preço: R$${produtoInfo.valorVenda.toFixed(2)}

IMPORTANTE: Este é um EBOOK DIGITAL (guia em formato PDF) com conteúdo textual estruturado em capítulos/módulos para leitura e aplicação prática.

Estruture a copy com as seguintes seções (sem usar formatação Markdown como #, ##, **, ***, ou qualquer outra marcação):
1. Título Principal Chamativo (focado no resultado/benefício)
2. Subtítulo Persuasivo (mencionando que é um guia digital completo)
3. Introdução/Problema (Agitar a dor específica do nicho)
4. Apresentação da Solução (Nome do Ebook - sem usar a palavra "ebook")
5. Detalhes/Capítulos/O Que Vai Aprender (estrutura do conteúdo digital)
6. Bônus Digitais Oferecidos (se aplicável - materiais complementares)
7. Prova Social (Depoimentos de quem leu o guia)
8. Garantia Incondicional (satisfação com o conteúdo)
9. Oferta Especial (Preço do guia digital, Escassez)
10. Chamada para Ação (Botão para download imediato)
11. FAQ (Perguntas sobre formato, acesso, conteúdo)
12. P.S. (Reforço final sobre o valor do conteúdo)

IMPORTANTE:
- Gere APENAS o texto da página de vendas para um EBOOK DIGITAL, sem nenhuma formatação Markdown
- Use apenas texto puro, sem símbolos como #, ##, **, ***, ou qualquer outra marcação
- Separe as seções com quebras de linha simples
- NÃO use títulos numerados ou com símbolos especiais
- ESCAPE TODAS as aspas duplas (") e barras invertidas (\\) necessárias
- O output final deve ser apenas texto limpo sem formatações especiais
- Enfatize que é um guia digital completo em formato PDF para download imediato
- Foque nos benefícios do conteúdo textual estruturado e aplicação prática`

    try {
        console.log(`[Service] Gerando copy de vendas para: ${produtoInfo.nome}`);
        // console.log("[Service] Prompt para Copy:", prompt); // Descomentar se necessário, mas pode ser muito longo
        let copyGerada = await generateText(prompt, systemPrompt);
        
        // Limpeza adicional para garantir que não há formatação Markdown
        copyGerada = copyGerada
            .replace(/^#+ /gm, '') // Remove # no início das linhas
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** (negrito)
            .replace(/\*(.*?)\*/g, '$1') // Remove * (itálico)
            .replace(/^- /gm, '') // Remove - no início das linhas (listas)
            .replace(/^> /gm, '') // Remove > no início das linhas (citações)
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links Markdown
            .replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduz múltiplas quebras de linha para no máximo 2
        
        console.log("[Service] Copy de vendas gerada com sucesso (início):", copyGerada.substring(0, 200) + "...");
        // Verificar se a copy não está vazia
        if (!copyGerada?.trim()) {
            console.error("[Service] API retornou copy vazia.");
            throw new Error("A API retornou uma copy de vendas vazia.");
        }
        return copyGerada;

    } catch (error) {
        console.error(`[Service] Erro ao gerar copy de vendas para '${produtoInfo.nome}':`, error);
        // Propaga o erro para a action tratar
        throw new Error(`Falha ao gerar copy de vendas: ${error instanceof Error ? error.message : String(error)}`);
    }
}
