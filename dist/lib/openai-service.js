"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOpenAI = callOpenAI;
exports.generateText = generateText;
exports.generateNichoSuggestions = generateNichoSuggestions;
exports.generateNichoContent = generateNichoContent;
exports.generateSubnichos = generateSubnichos;
exports.generateProdutoPrincipal = generateProdutoPrincipal;
exports.generateOrderBumps = generateOrderBumps;
exports.generateUpsell = generateUpsell;
exports.generateDownsell = generateDownsell;
exports.generateCopyPaginaVendas = generateCopyPaginaVendas;
const openai_config_1 = require("./openai-config");
const rate_limiter_1 = require("./rate-limiter");
async function callOpenAI(messages, retryCount = 0) {
    if (!openai_config_1.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY não está definida");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), openai_config_1.OPENAI_TIMEOUT);
    try {
        console.log(`[OpenAI] Tentativa ${retryCount + 1}/${openai_config_1.OPENAI_MAX_RETRIES + 1} - Enviando requisição...`);
        const response = await fetch(openai_config_1.OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${openai_config_1.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: openai_config_1.OPENAI_MODEL,
                messages,
                max_tokens: openai_config_1.OPENAI_MAX_TOKENS,
                temperature: openai_config_1.OPENAI_TEMPERATURE,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = `Erro na API da OpenAI (${response.status}): ${JSON.stringify(errorData)}`;
            if ((response.status === 429 || response.status >= 500) && retryCount < openai_config_1.OPENAI_MAX_RETRIES) {
                console.log(`[OpenAI] Erro ${response.status}, tentando novamente em 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
                return callOpenAI(messages, retryCount + 1);
            }
            throw new Error(errorMessage);
        }
        const result = await response.json();
        console.log(`[OpenAI] Requisição bem-sucedida! Tokens usados: ${result.usage?.total_tokens || 'N/A'}`);
        return result;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if ((error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) && retryCount < openai_config_1.OPENAI_MAX_RETRIES) {
            console.log(`[OpenAI] Timeout/erro de rede, tentando novamente em 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
            return callOpenAI(messages, retryCount + 1);
        }
        console.error("Erro ao chamar a API da OpenAI:", error);
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Timeout: A API da OpenAI demorou mais que ${openai_config_1.OPENAI_TIMEOUT / 1000} segundos para responder. Tente novamente.`);
        }
        throw error;
    }
}
async function generateText(prompt, systemPrompt) {
    const messages = [];
    if (systemPrompt) {
        messages.push({
            role: "system",
            content: systemPrompt,
        });
    }
    messages.push({
        role: "user",
        content: prompt,
    });
    try {
        const totalChars = (systemPrompt || '').length + prompt.length;
        const estimatedInputTokens = Math.ceil(totalChars / 4);
        const estimatedOutputTokens = 8000;
        const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;
        console.log(`[OpenAI Service] Estimativa de tokens: ${totalEstimatedTokens} (input: ${estimatedInputTokens}, output: ${estimatedOutputTokens})`);
        await rate_limiter_1.rateLimiter.waitForAvailability(totalEstimatedTokens);
        const response = await callOpenAI(messages);
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("API da OpenAI retornou conteúdo vazio.");
        }
        console.log(`[OpenAI Service] Tokens reais usados: ${response.usage?.total_tokens || 'N/A'}`);
        return content;
    }
    catch (error) {
        console.error("Erro ao gerar texto:", error);
        throw new Error(`Falha ao gerar texto: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function generateNichoSuggestions(termo) {
    const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais. 
  Forneça sugestões de nichos de mercado lucrativos para produtos digitais.`;
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
       Retorne apenas os nomes dos nichos, um por linha, sem numeração ou explicações adicionais.`;
    try {
        const response = await generateText(prompt, systemPrompt);
        const suggestions = response.split("\n").filter((line) => line.trim() !== "");
        if (suggestions.length === 0) {
            throw new Error("Nenhuma sugestão de nicho foi gerada.");
        }
        return suggestions;
    }
    catch (error) {
        console.error("Erro ao gerar sugestões de nichos:", error);
        throw new Error(`Falha ao gerar sugestões de nicho: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function generateNichoContent(nicho) {
    const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais.
  Crie conteúdo envolvente e informativo para o nicho especificado.`;
    const prompt = `Gere um parágrafo curto e envolvente sobre o nicho de "${nicho}".
  O parágrafo deve destacar a importância do nicho e seu potencial para produtos digitais.
  Limite a resposta a 150 caracteres.`;
    try {
        const response = await generateText(prompt, systemPrompt);
        if (!response) {
            throw new Error("Nenhum conteúdo de nicho foi gerado.");
        }
        return response;
    }
    catch (error) {
        console.error("Erro ao gerar conteúdo do nicho:", error);
        throw new Error(`Falha ao gerar conteúdo do nicho: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function extrairSubnichosValidos(text) {
    const subnichos = [];
    let contador = 1;
    const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    const matches = text.match(regex);
    if (!matches)
        return [];
    for (const match of matches) {
        try {
            const obj = JSON.parse(match);
            if (obj.nome &&
                typeof obj.pesquisasMensais === "number" &&
                typeof obj.cpc === "number" &&
                Array.isArray(obj.palavrasChave) &&
                Array.isArray(obj.termosPesquisa) &&
                typeof obj.potencialRentabilidade === "number") {
                if (!obj.id) {
                    obj.id = `subnicho_${contador}`;
                }
                subnichos.push(obj);
                contador++;
                if (subnichos.length >= 7)
                    break;
            }
        }
        catch (e) {
            console.log("Erro ao analisar objeto de subnicho:", e);
        }
    }
    return subnichos;
}
function extrairOrderBumpsValidos(text) {
    const orderBumps = [];
    const regex = /\{[\s\S]*?(?:\{[\s\S]*?\}[\s\S]*?)*?\}/g;
    const matches = text.match(regex);
    if (!matches)
        return [];
    for (const match of matches) {
        try {
            const cleanedMatch = match
                .replace(/(\w+):/g, '"$1":')
                .replace(/:\s*'([^']*)'/g, ':"$1"')
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]");
            const obj = JSON.parse(cleanedMatch);
            if (obj.nome && obj.descricao && (typeof obj.valorVenda === "number" || obj.valorVenda === 9.9)) {
                if (typeof obj.valorVenda !== "number") {
                    obj.valorVenda = 9.9;
                }
                if (!obj.problemaPrincipal) {
                    obj.problemaPrincipal = `Dificuldade específica relacionada a ${obj.nome}`;
                }
                orderBumps.push(obj);
                if (orderBumps.length >= 5)
                    break;
            }
        }
        catch (e) {
            console.log("Erro ao analisar objeto de order bump:", e);
        }
    }
    return orderBumps;
}
async function generateSubnichos(nicho) {
    const systemPrompt = `Você é um especialista em marketing digital e criação de produtos digitais.
  Forneça informações detalhadas sobre subnichos de mercado para o nicho principal fornecido.
  IMPORTANTE: Sua resposta deve conter objetos JSON válidos.`;
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
  
  Retorne 7 objetos JSON válidos.`;
    try {
        const response = await generateText(prompt, systemPrompt);
        console.log("Resposta da API (primeiros 200 caracteres):", response.substring(0, 200) + "...");
        const subnichos = extrairSubnichosValidos(response);
        const MIN_SUBNICHOS = 3;
        if (subnichos.length < MIN_SUBNICHOS) {
            throw new Error(`Falha ao extrair subnichos válidos suficientes (encontrados: ${subnichos.length}, mínimo: ${MIN_SUBNICHOS}). Resposta da API: ${response.substring(0, 500)}...`);
        }
        console.log(`Extraídos ${subnichos.length} subnichos válidos.`);
        return subnichos;
    }
    catch (error) {
        console.error("Erro ao gerar subnichos:", error);
        throw new Error(`Falha ao gerar subnichos para '${nicho}': ${error instanceof Error ? error.message : String(error)}`);
    }
}
function verificarQualidadeProduto(produto, nichoNome) {
    const nomeContemNicho = produto.nome?.toLowerCase().includes(nichoNome.toLowerCase());
    const descricaoContemNicho = produto.descricao?.toLowerCase().split("\n\n").every((p) => p.includes(nichoNome.toLowerCase()));
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
async function generateProdutoPrincipal(nicho, subnicho) {
    const nichoNome = subnicho?.nome || nicho;
    const palavrasChave = subnicho?.palavrasChave || [];
    const termosPesquisa = subnicho?.termosPesquisa || [];
    const potencialRentabilidade = subnicho?.potencialRentabilidade || 80;
    const systemPrompt = `Você é um estrategista digital especializado em criação de ebooks digitais de alta conversão, com um faturamento comprovado de 100 milhões de dólares em marketing digital.
Sua principal habilidade é criar ebooks digitais de alta demanda que resolvem problemas de maneiras únicas através de conteúdo textual estruturado, guias práticos e materiais de leitura digital.
Mentorado por gigantes do marketing digital como Alex Hormozi, Dan Kennedy e Gary Halbert, você se destaca por desenvolver ebooks digitais que são inovadores, práticos e irresistíveis.
Você vai usar todas suas habilidades para criar um ebook digital de alta conversão para o nicho específico de "${nichoNome}".

IMPORTANTE: Todos os produtos devem ser estruturados como EBOOKS DIGITAIS (conteúdo em formato PDF/digital para leitura), organizados em capítulos/módulos de conteúdo textual, guias práticos, estratégias escritas e materiais informativos.`;
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
7. Retorne APENAS o objeto JSON válido completo.`;
    try {
        let tentativas = 0;
        const maxTentativas = 3;
        let lastError = null;
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
                let produtoParcial;
                let jsonString = jsonMatch[0];
                try {
                    jsonString = jsonString.replace(/,\s*(}|])/g, "$1");
                    produtoParcial = JSON.parse(jsonString);
                    const produtoParaValidar = { ...produtoParcial, copyPaginaVendas: "" };
                    const qualidadeOk = produtoParaValidar.nome && produtoParaValidar.descricao && produtoParaValidar.persona && produtoParaValidar.valorVenda === 47.0;
                    console.log(`[Tentativa ${tentativas + 1}] Verificação de Qualidade (Simplificada): ${qualidadeOk}`);
                    if (qualidadeOk) {
                        console.log(`Detalhes do produto principal gerados com sucesso para "${nichoNome}"!`);
                        return { ...produtoParcial, copyPaginaVendas: "" };
                    }
                    console.log(`[Tentativa ${tentativas + 1}] Produto não passou na verificação de qualidade.`);
                    lastError = new Error("Produto gerado não atendeu aos critérios de qualidade.");
                    tentativas++;
                }
                catch (parseError) {
                    console.error(`[Tentativa ${tentativas + 1}] Erro ao parsear JSON:`, parseError);
                    console.log(`[Tentativa ${tentativas + 1}] JSON inválido (bruto):`, jsonMatch[0].substring(0, 500) + "...");
                    if (jsonString !== jsonMatch[0]) {
                        console.log(`[Tentativa ${tentativas + 1}] JSON após limpeza (ainda inválido):`, jsonString.substring(0, 500) + "...");
                    }
                    lastError = parseError;
                    tentativas++;
                }
            }
            catch (innerError) {
                console.error(`[Tentativa ${tentativas + 1}] Erro interno no loop:`, innerError);
                lastError = innerError;
                tentativas++;
            }
        }
        console.error(`Falha ao gerar produto principal para '${nichoNome}' após ${maxTentativas} tentativas. Último erro:`, lastError);
        throw new Error(`Falha ao gerar produto principal após ${maxTentativas} tentativas. Último erro: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    }
    catch (error) {
        console.error(`Erro GERAL ao gerar produto principal para '${nichoNome}':`, error);
        throw new Error(`Falha na geração do produto principal: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function generateOrderBumps(nicho, subnicho, produtoPrincipal) {
    const nichoNome = subnicho?.nome || nicho;
    const produtoNome = produtoPrincipal?.nome || `Guia Completo de ${nichoNome}`;
    const produtoDescricao = produtoPrincipal?.descricao || "";
    console.log(`[generateOrderBumps] Verificando dados de entrada:
    - Nome do produto: ${produtoNome}
    - Tem copyPaginaVendas: ${!!produtoPrincipal?.copyPaginaVendas}
    - Tipo de copyPaginaVendas: ${typeof produtoPrincipal?.copyPaginaVendas}
    - Tamanho da copyPaginaVendas: ${produtoPrincipal?.copyPaginaVendas?.length || 0}
    - Tem persona: ${!!produtoPrincipal?.persona}`);
    try {
        const modulos = extrairModulos(produtoPrincipal?.copyPaginaVendas || "");
        const pontosDor = extrairPontosDor(JSON.stringify(produtoPrincipal?.persona) || "");
        const objetivos = extrairObjetivos(JSON.stringify(produtoPrincipal?.persona) || "");
        const systemPrompt = `Você é um especialista em criação de produtos digitais complementares (order bumps) para ebooks digitais no nicho específico de "${nichoNome}".
Sua tarefa é criar order bumps que sejam EXTENSÕES DIRETAS do ebook principal "${produtoNome}".
Cada order bump deve ser um complemento digital que melhora a experiência de leitura e aplicação do ebook principal.
Os order bumps devem ser materiais digitais complementares (PDFs, planilhas, templates, checklists) que fazem sentido APENAS quando usados junto com o ebook principal.

FOCO EM EBOOKS: Todos os complementos devem ser adequados para quem está lendo um ebook digital e quer aplicar o conteúdo na prática.`;
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

Retorne 5 objetos JSON válidos, um para cada order bump digital.`;
        let tentativas = 0;
        const maxTentativas = 3;
        const MIN_ORDER_BUMPS = 2;
        while (tentativas < maxTentativas) {
            console.log(`Tentativa ${tentativas + 1} de gerar order bumps para "${nichoNome}"`);
            const response = await generateText(prompt, systemPrompt);
            console.log("Resposta da API (order bumps - primeiros 200):", response.substring(0, 200) + "...");
            const orderBumps = extrairOrderBumpsValidos(response);
            if (orderBumps.length >= MIN_ORDER_BUMPS) {
                console.log(`Extraídos ${orderBumps.length} order bumps válidos.`);
                return orderBumps.slice(0, 5);
            }
            console.log(`Order bumps gerados (${orderBumps.length}) insuficientes (mínimo ${MIN_ORDER_BUMPS}), tentando novamente...`);
            tentativas++;
        }
        throw new Error(`Falha ao gerar order bumps suficientes para '${nichoNome}' após ${maxTentativas} tentativas.`);
    }
    catch (error) {
        console.error("Erro ao gerar order bumps:", error);
        throw new Error(`Falha na geração de order bumps para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`);
    }
}
function extrairPontosDor(personaText) {
    if (!personaText || typeof personaText !== 'string') {
        console.warn("extrairPontosDor: personaText é indefinido ou não é uma string");
        return "Frustração com métodos tradicionais, excesso de informação desorganizada, dificuldade em encontrar estratégias práticas";
    }
    try {
        try {
            const personaObj = JSON.parse(personaText);
            if (personaObj && personaObj.pontosDeDor && Array.isArray(personaObj.pontosDeDor)) {
                return personaObj.pontosDeDor.join(", ");
            }
        }
        catch (jsonError) {
            console.log("Não foi possível parsear personaText como JSON, tentando extração de texto");
        }
        const pontosDorMatch = personaText.match(/\*\*Pontos de Dor:\*\*([\s\S]*?)(?:\*\*\w|$)/i);
        if (pontosDorMatch && pontosDorMatch[1]) {
            return pontosDorMatch[1].trim();
        }
    }
    catch (error) {
        console.error("Erro ao extrair pontos de dor:", error);
    }
    return "Frustração com métodos tradicionais, excesso de informação desorganizada, dificuldade em encontrar estratégias práticas";
}
function extrairModulos(copyText) {
    if (!copyText || typeof copyText !== 'string') {
        console.warn("extrairModulos: copyText é indefinido ou não é uma string");
        return "Capítulos estruturados com conteúdo prático e aplicável";
    }
    try {
        const modulosMatch = copyText.match(/O QUE VOCÊ VAI ENCONTRAR[\s\S]*?(?:###|$)/i) ||
            copyText.match(/MÓDULO[\s\S]*?(?:###|$)/i) ||
            copyText.match(/CAPÍTULO[\s\S]*?(?:###|$)/i) ||
            copyText.match(/CONTEÚDO[\s\S]*?(?:###|$)/i);
        if (modulosMatch && modulosMatch[0]) {
            return modulosMatch[0].trim();
        }
    }
    catch (error) {
        console.error("Erro ao extrair módulos da copy:", error);
    }
    return "Capítulos estruturados com conteúdo prático e aplicável para leitura digital";
}
function extrairObjetivos(personaText) {
    if (!personaText || typeof personaText !== 'string') {
        console.warn("extrairObjetivos: personaText é indefinido ou não é uma string");
        return "Dominar o tema, aplicar conhecimentos práticos, economizar tempo e recursos";
    }
    try {
        try {
            const personaObj = JSON.parse(personaText);
            if (personaObj && personaObj.objetivos && Array.isArray(personaObj.objetivos)) {
                return personaObj.objetivos.join(", ");
            }
        }
        catch (jsonError) {
            console.log("Não foi possível parsear personaText como JSON, tentando extração de texto");
        }
        const objetivosMatch = personaText.match(/\*\*Objetivos:\*\*([\s\S]*?)(?:\*\*\w|$)/i);
        if (objetivosMatch && objetivosMatch[1]) {
            return objetivosMatch[1].trim();
        }
    }
    catch (error) {
        console.error("Erro ao extrair objetivos:", error);
    }
    return "Dominar o tema, aplicar conhecimentos práticos, economizar tempo e recursos";
}
async function generateUpsell(nicho, subnicho, produtoPrincipal) {
    const nichoNome = subnicho?.nome || nicho;
    const systemPrompt = `Você é um especialista em marketing digital e criação de ebooks digitais premium.
  Crie um upsell que seja um EBOOK PREMIUM mais avançado e completo que complementa o ebook principal.`;
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
  
  Retorne apenas um objeto JSON válido, sem explicações adicionais.`;
    try {
        let tentativas = 0;
        const maxTentativas = 3;
        while (tentativas < maxTentativas) {
            console.log(`Tentativa ${tentativas + 1} de gerar upsell para "${nichoNome}"`);
            const response = await generateText(prompt, systemPrompt);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const upsellData = JSON.parse(jsonMatch[0]);
                    if (upsellData.copyPaginaVendas) {
                        upsellData.copyPaginaVendas = upsellData.copyPaginaVendas
                            .replace(/^#+ /gm, '')
                            .replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/\*(.*?)\*/g, '$1')
                            .replace(/^- /gm, '')
                            .replace(/^> /gm, '')
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                            .replace(/\n\s*\n\s*\n/g, '\n\n');
                    }
                    const upsell = upsellData;
                    if (upsell.nome && upsell.descricao && upsell.copyPaginaVendas && upsell.valorVenda === 97.0) {
                        console.log(`Upsell gerado com sucesso para ${nichoNome}.`);
                        return upsell;
                    }
                    console.log("Upsell gerado não passou na verificação de qualidade, tentando novamente...");
                }
                catch (e) {
                    console.error("Erro ao analisar JSON do Upsell na tentativa", e);
                }
            }
            tentativas++;
        }
        throw new Error(`Falha ao gerar upsell para '${nichoNome}' após ${maxTentativas} tentativas.`);
    }
    catch (error) {
        console.error("Erro ao gerar upsell:", error);
        throw new Error(`Falha na geração do upsell para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function generateDownsell(nicho, subnicho, produtoPrincipal, upsell) {
    const nichoNome = subnicho?.nome || nicho;
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
                    const downsellData = JSON.parse(jsonMatch[0]);
                    if (downsellData.copyPaginaVendas) {
                        downsellData.copyPaginaVendas = downsellData.copyPaginaVendas
                            .replace(/^#+ /gm, '')
                            .replace(/\*\*(.*?)\*\*/g, '$1')
                            .replace(/\*(.*?)\*/g, '$1')
                            .replace(/^- /gm, '')
                            .replace(/^> /gm, '')
                            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                            .replace(/\n\s*\n\s*\n/g, '\n\n');
                    }
                    const downsell = downsellData;
                    console.log(`[Tentativa ${tentativas + 1}] Downsell parseado: 
            Nome: ${downsell.nome || 'N/A'} 
            Valor: ${downsell.valorVenda || 'N/A'}
            Tem descrição: ${!!downsell.descricao}
            Tem copy: ${!!downsell.copyPaginaVendas}`);
                    if (downsell.nome && downsell.descricao && downsell.copyPaginaVendas && downsell.valorVenda === 27.0) {
                        console.log(`Downsell gerado com sucesso para ${nichoNome}.`);
                        return downsell;
                    }
                    console.log("Downsell gerado não passou na verificação de qualidade. Razões:", !downsell.nome ? "Nome ausente" : "", !downsell.descricao ? "Descrição ausente" : "", !downsell.copyPaginaVendas ? "Copy ausente" : "", downsell.valorVenda !== 27.0 ? `Valor incorreto (${downsell.valorVenda} em vez de 27.0)` : "");
                }
                catch (e) {
                    console.error("Erro ao analisar JSON do Downsell na tentativa:", e);
                }
            }
            tentativas++;
        }
        throw new Error(`Falha ao gerar downsell para '${nichoNome}' após ${maxTentativas} tentativas.`);
    }
    catch (error) {
        console.error("Erro ao gerar downsell:", error);
        throw new Error(`Falha na geração do downsell para '${nichoNome}': ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function generateCopyPaginaVendas(produtoInfo) {
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
- Foque nos benefícios do conteúdo textual estruturado e aplicação prática`;
    try {
        console.log(`[Service] Gerando copy de vendas para: ${produtoInfo.nome}`);
        let copyGerada = await generateText(prompt, systemPrompt);
        copyGerada = copyGerada
            .replace(/^#+ /gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^- /gm, '')
            .replace(/^> /gm, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/\n\s*\n\s*\n/g, '\n\n');
        console.log("[Service] Copy de vendas gerada com sucesso (início):", copyGerada.substring(0, 200) + "...");
        if (!copyGerada?.trim()) {
            console.error("[Service] API retornou copy vazia.");
            throw new Error("A API retornou uma copy de vendas vazia.");
        }
        return copyGerada;
    }
    catch (error) {
        console.error(`[Service] Erro ao gerar copy de vendas para '${produtoInfo.nome}':`, error);
        throw new Error(`Falha ao gerar copy de vendas: ${error instanceof Error ? error.message : String(error)}`);
    }
}
