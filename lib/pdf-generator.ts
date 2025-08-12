import { generateText } from './openai-service';
import { puppeteerPool, performanceMetrics } from './rate-limiter';

export interface EbookData {
  nome: string;
  descricao: string;
  nicho: string;
  subnicho: string;
  persona?: any;
}

export interface EbookChapter {
  numero: number;
  titulo: string;
  conteudo: string;
  paginas: number;
}

export interface EbookStructure {
  titulo: string;
  autor: string;
  introducao: string;
  capitulos: EbookChapter[];
  conclusao: string;
  totalPaginas: number;
}

/**
 * Gera a estrutura completa do ebook com conteúdo para 30 páginas
 */
export async function generateEbookStructure(data: EbookData): Promise<EbookStructure> {
  const systemPrompt = `Você é um escritor especializado em ebooks digitais de alta qualidade e best-sellers.
Sua tarefa é criar uma estrutura completa de ebook com conteúdo detalhado que totalize exatamente 30 páginas.

ESPECIFICAÇÕES TÉCNICAS OBRIGATÓRIAS:
- Cada página deve ter EXATAMENTE 350-400 palavras
- Total necessário: 10.500-12.000 palavras distribuídas assim:
  * Introdução: 700-800 palavras (2 páginas)
  * Cada capítulo: 1.050-1.200 palavras (3 páginas) x 7 capítulos = 21 páginas
  * Conclusão: 700-800 palavras (2 páginas)
  * Total: 30 páginas exatas

QUALIDADE DO CONTEÚDO:
- Estrutura profissional com introdução envolvente, desenvolvimento lógico e conclusão impactante
- Conteúdo 100% prático e aplicável com exemplos reais
- Linguagem clara, envolvente e profissional
- Cada capítulo deve ter subtítulos e estrutura interna
- Incluir dicas, estratégias e casos práticos`;

  const prompt = `Crie a estrutura completa de um ebook profissional de 30 páginas sobre "${data.nome}" para o nicho de "${data.nicho}" (subnicho: "${data.subnicho}").

ESTRUTURA OBRIGATÓRIA (30 páginas exatas):
- Introdução (2 páginas = 700-800 palavras)
- 7 Capítulos (3 páginas cada = 1.050-1.200 palavras por capítulo)
- Conclusão (2 páginas = 700-800 palavras)

REQUISITOS DE CONTEÚDO:
Para a INTRODUÇÃO (700-800 palavras):
- Apresente o problema/desafio do nicho
- Explique por que este guia é necessário
- Prometa resultados específicos
- Crie expectativa e engajamento

Para cada CAPÍTULO (1.050-1.200 palavras cada):
- Título específico e atrativo
- Introdução do conceito (150-200 palavras)
- Desenvolvimento com 2-3 subtópicos (600-700 palavras)
- Exemplos práticos e casos reais (200-250 palavras)
- Dicas de implementação (100-150 palavras)

Para a CONCLUSÃO (700-800 palavras):
- Recapitule os pontos principais
- Reforce os benefícios obtidos
- Motive à ação
- Deixe uma mensagem inspiradora

DIRETRIZES DE QUALIDADE:
- Use linguagem clara e profissional
- Inclua exemplos específicos do nicho "${data.nicho}"
- Estruture com subtítulos para facilitar leitura
- Foque em resultados práticos e aplicáveis
- Mantenha tom motivacional e autoritativo

Retorne em formato JSON válido:
{
  "titulo": "${data.nome}",
  "autor": "Especialista em ${data.nicho}",
  "introducao": "CONTEÚDO COMPLETO DA INTRODUÇÃO COM EXATAMENTE 700-800 PALAVRAS",
  "capitulos": [
    {
      "numero": 1,
      "titulo": "Título específico do capítulo 1",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS, incluindo subtítulos, exemplos e dicas práticas",
      "paginas": 3
    },
    {
      "numero": 2,
      "titulo": "Título específico do capítulo 2",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    },
    {
      "numero": 3,
      "titulo": "Título específico do capítulo 3",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    },
    {
      "numero": 4,
      "titulo": "Título específico do capítulo 4",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    },
    {
      "numero": 5,
      "titulo": "Título específico do capítulo 5",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    },
    {
      "numero": 6,
      "titulo": "Título específico do capítulo 6",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    },
    {
      "numero": 7,
      "titulo": "Título específico do capítulo 7",
      "conteudo": "CONTEÚDO COMPLETO DO CAPÍTULO COM EXATAMENTE 1.050-1.200 PALAVRAS",
      "paginas": 3
    }
  ],
  "conclusao": "CONTEÚDO COMPLETO DA CONCLUSÃO COM EXATAMENTE 700-800 PALAVRAS",
  "totalPaginas": 30
}

CRÍTICO: Retorne APENAS o JSON válido acima.
- Use APENAS aspas duplas (")
- NÃO use vírgulas extras antes de } ou ]
- NÃO inclua quebras de linha dentro de strings
- NÃO adicione texto antes ou depois do JSON`;

  try {
    console.log(`[PDF Generator] Gerando estrutura do ebook: ${data.nome}`);
    const response = await generateText(prompt, systemPrompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Estrutura JSON não encontrada na resposta");
    }

    // Limpar e corrigir JSON malformado
    let jsonString = jsonMatch[0];

    // Corrigir problemas comuns de JSON
    jsonString = jsonString
      // Remover vírgulas extras antes de } ou ]
      .replace(/,(\s*[}\]])/g, '$1')
      // Corrigir aspas simples para duplas
      .replace(/'/g, '"')
      // Remover quebras de linha dentro de strings
      .replace(/"\s*\n\s*"/g, '" "')
      // Corrigir vírgulas ausentes entre elementos de array
      .replace(/"\s*\n\s*"/g, '", "')
      // Remover caracteres de controle
      .replace(/[\x00-\x1F\x7F]/g, '');

    console.log(`[PDF Generator] JSON limpo (primeiros 500 chars): ${jsonString.substring(0, 500)}...`);

    const structure = JSON.parse(jsonString) as EbookStructure;
    
    // Validação básica
    if (!structure.titulo || !structure.introducao || !structure.capitulos || structure.capitulos.length === 0) {
      throw new Error("Estrutura do ebook incompleta");
    }

    console.log(`[PDF Generator] Estrutura gerada com ${structure.capitulos.length} capítulos`);
    return structure;

  } catch (error) {
    console.error("[PDF Generator] Erro ao gerar estrutura:", error);

    // Se for erro de JSON, tentar uma segunda abordagem
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      console.log('[PDF Generator] Tentando abordagem alternativa para JSON malformado...');

      try {
        const response = await generateText(prompt, systemPrompt);

        // Tentar extrair JSON de forma mais agressiva
        const jsonMatches = response.match(/\{[\s\S]*?\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Pegar o maior JSON encontrado
          const largestJson = jsonMatches.reduce((a, b) => a.length > b.length ? a : b);

          // Limpeza mais agressiva
          let cleanJson = largestJson
            .replace(/,\s*([}\]])/g, '$1')  // Remove vírgulas extras
            .replace(/([{\[,]\s*)"(\w+)":/g, '$1"$2":')  // Garante aspas nas chaves
            .replace(/:\s*"([^"]*?)"\s*([,}\]])/g, ': "$1"$2')  // Garante aspas nos valores
            .replace(/\n/g, ' ')  // Remove quebras de linha
            .replace(/\s+/g, ' ')  // Normaliza espaços
            .trim();

          const structure = JSON.parse(cleanJson) as EbookStructure;
          console.log(`[PDF Generator] Estrutura recuperada com ${structure.capitulos?.length || 0} capítulos`);
          return structure;
        }
      } catch (retryError) {
        console.error('[PDF Generator] Falha na tentativa de recuperação:', retryError);
      }
    }

    throw new Error(`Falha ao gerar estrutura do ebook: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Gera o HTML formatado do ebook
 */
export function generateEbookHTML(structure: EbookStructure): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${structure.titulo}</title>
    <style>
        /* Configuração de páginas com numeração e cabeçalhos */
        @page {
            size: A4;
            margin: 2.5cm 2cm 2.5cm 2cm;
        }

        @page :first {
            margin: 0;
            @top-center { content: none; }
            @bottom-center { content: none; }
        }

        @page toc {
            @top-center {
                content: "SUMÁRIO";
                font-family: 'Georgia', serif;
                font-size: 10px;
                color: #666;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            @bottom-center {
                content: counter(page, lower-roman);
                font-family: 'Georgia', serif;
                font-size: 10px;
                color: #666;
            }
        }

        @page content {
            @top-center {
                content: "${structure.titulo}";
                font-family: 'Georgia', serif;
                font-size: 10px;
                color: #666;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            @bottom-center {
                content: "Página " counter(page);
                font-family: 'Georgia', serif;
                font-size: 10px;
                color: #666;
            }
        }

        body {
            font-family: 'Georgia', serif;
            line-height: 1.7;
            color: #2c3e50;
            max-width: 100%;
            margin: 0;
            padding: 0;
            font-size: 11pt;
        }

        /* Reset de contadores */
        body { counter-reset: page; }

        /* Página de Capa */
        .cover-page {
            page: first;
            page-break-after: always;
            text-align: center;
            padding-top: 25%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .cover-title {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 0.5em;
            line-height: 1.2;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            max-width: 80%;
        }

        .cover-subtitle {
            font-size: 1.3em;
            margin-bottom: 2em;
            opacity: 0.9;
            font-style: italic;
        }

        .cover-author {
            font-size: 1.4em;
            margin-top: 3em;
            font-weight: 300;
        }

        .cover-date {
            font-size: 1em;
            margin-top: 1em;
            opacity: 0.8;
        }

        /* Página de Créditos */
        .credits-page {
            page: first;
            page-break-after: always;
            padding: 4cm 2cm;
            font-size: 10pt;
            line-height: 1.5;
        }

        .credits-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 2em;
            text-align: center;
            color: #2c3e50;
        }

        .credits-info {
            margin-bottom: 1.5em;
        }

        .credits-info strong {
            color: #34495e;
        }

        /* Sumário */
        .toc-page {
            page: toc;
            page-break-after: always;
            padding-top: 2em;
        }

        .toc-title {
            font-size: 2.2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 2em;
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 0.5em;
        }

        .toc-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.8em;
            padding: 0.3em 0;
            border-bottom: 1px dotted #bdc3c7;
        }

        .toc-item-title {
            font-weight: 500;
            color: #2c3e50;
        }

        .toc-item-page {
            font-weight: bold;
            color: #3498db;
        }

        /* Conteúdo Principal */
        .content-section {
            page: content;
            page-break-before: always;
            margin-bottom: 2em;
        }

        .chapter-title {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 1.5em;
            border-bottom: 3px solid #3498db;
            padding-bottom: 0.5em;
            line-height: 1.3;
        }

        .intro-title, .conclusion-title {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 1.5em;
            border-bottom: 3px solid #e74c3c;
            padding-bottom: 0.5em;
            line-height: 1.3;
        }

        p {
            margin-bottom: 1.2em;
            text-align: justify;
            text-indent: 1.8em;
            line-height: 1.7;
            orphans: 3;
            widows: 3;
        }

        .no-indent {
            text-indent: 0;
        }

        .first-paragraph {
            text-indent: 0;
            font-weight: 500;
        }

        h3 {
            color: #34495e;
            font-size: 1.3em;
            margin-top: 2em;
            margin-bottom: 0.8em;
            font-weight: 600;
        }

        h4 {
            color: #34495e;
            font-size: 1.1em;
            margin-top: 1.5em;
            margin-bottom: 0.6em;
            font-weight: 600;
        }

        .highlight-box {
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            padding: 1em;
            margin: 1.5em 0;
            font-style: italic;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <!-- Capa -->
    <div class="cover-page">
        <h1 class="cover-title">${structure.titulo}</h1>
        <p class="cover-subtitle">Guia Completo e Prático</p>
        <p class="cover-author">Por ${structure.autor}</p>
        <p class="cover-date">${new Date().getFullYear()}</p>
    </div>

    <!-- Página de Créditos -->
    <div class="credits-page">
        <h2 class="credits-title">Informações da Publicação</h2>

        <div class="credits-info">
            <strong>Título:</strong> ${structure.titulo}
        </div>

        <div class="credits-info">
            <strong>Autor:</strong> ${structure.autor}
        </div>

        <div class="credits-info">
            <strong>Ano de Publicação:</strong> ${new Date().getFullYear()}
        </div>

        <div class="credits-info">
            <strong>Páginas:</strong> ${structure.totalPaginas}
        </div>

        <div class="credits-info">
            <strong>Formato:</strong> PDF Digital
        </div>

        <div class="credits-info">
            <strong>Versão:</strong> 1.0
        </div>

        <div class="credits-info" style="margin-top: 3em;">
            <strong>Sobre este Ebook:</strong><br>
            Este ebook foi criado para fornecer informações práticas e aplicáveis sobre o tema abordado.
            O conteúdo foi desenvolvido com base em pesquisas e melhores práticas da área.
        </div>

        <div class="credits-info" style="margin-top: 2em;">
            <strong>Direitos Autorais:</strong><br>
            © ${new Date().getFullYear()} ${structure.autor}. Todos os direitos reservados.
            É proibida a reprodução total ou parcial desta obra sem autorização prévia do autor.
        </div>
    </div>

    <!-- Sumário -->
    <div class="toc-page">
        <h2 class="toc-title">Sumário</h2>

        <div class="toc-item">
            <span class="toc-item-title">Introdução</span>
            <span class="toc-item-page">1</span>
        </div>

        ${structure.capitulos.map((capitulo, index) => {
            const startPage = 3 + (index * 4); // Aproximação: cada capítulo começa a cada 4 páginas
            return `
        <div class="toc-item">
            <span class="toc-item-title">Capítulo ${capitulo.numero}: ${capitulo.titulo}</span>
            <span class="toc-item-page">${startPage}</span>
        </div>`;
        }).join('')}

        <div class="toc-item">
            <span class="toc-item-title">Conclusão</span>
            <span class="toc-item-page">${3 + (structure.capitulos.length * 4)}</span>
        </div>
    </div>

    <!-- Introdução -->
    <div class="content-section">
        <h2 class="intro-title">Introdução</h2>
        ${formatContentWithFirstParagraph(structure.introducao)}
    </div>

    <!-- Capítulos -->
    ${structure.capitulos.map(capitulo => `
    <div class="content-section">
        <h2 class="chapter-title">Capítulo ${capitulo.numero}: ${capitulo.titulo}</h2>
        ${formatContentWithFirstParagraph(capitulo.conteudo)}
    </div>
    `).join('')}

    <!-- Conclusão -->
    <div class="content-section">
        <h2 class="conclusion-title">Conclusão</h2>
        ${formatContentWithFirstParagraph(structure.conclusao)}
    </div>
</body>
</html>`;
}

/**
 * Formata o conteúdo em parágrafos HTML
 */
function formatContent(content: string): string {
  return content
    .split('\n\n')
    .filter(paragraph => paragraph.trim().length > 0)
    .map(paragraph => `<p>${paragraph.trim()}</p>`)
    .join('\n');
}

/**
 * Formata o conteúdo com primeiro parágrafo destacado
 */
function formatContentWithFirstParagraph(content: string): string {
  const paragraphs = content
    .split('\n\n')
    .filter(paragraph => paragraph.trim().length > 0);

  if (paragraphs.length === 0) return '';

  const formattedParagraphs = paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();

    // Detectar subtítulos (linhas que terminam com :)
    if (trimmed.endsWith(':') && trimmed.length < 100) {
      return `<h3>${trimmed}</h3>`;
    }

    // Detectar listas (linhas que começam com -, *, ou números)
    if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
      return `<p class="no-indent">${trimmed}</p>`;
    }

    // Primeiro parágrafo sem indentação
    if (index === 0) {
      return `<p class="first-paragraph no-indent">${trimmed}</p>`;
    }

    // Parágrafos normais
    return `<p>${trimmed}</p>`;
  });

  return formattedParagraphs.join('\n');
}

/**
 * Gera o PDF do ebook usando Puppeteer
 */
export async function generateEbookPDF(structure: EbookStructure): Promise<Buffer> {
  let browser;
  const startTime = performance.now();

  try {
    console.log(`[PDF Generator] Iniciando geração de PDF para: ${structure.titulo}`);

    // Usar pool de browsers para melhor performance
    browser = await puppeteerPool.getBrowser();

    const page = await browser.newPage();

    // Configurar viewport para melhor renderização
    await page.setViewport({ width: 1200, height: 1600 });

    const html = generateEbookHTML(structure);

    // Aguardar carregamento completo
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 45000 // Aumentado para 45 segundos
    });

    // Aguardar um pouco mais para garantir renderização completa
    await page.waitForTimeout(1500); // Reduzido para 1.5 segundos

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '2.5cm',
        right: '2cm',
        bottom: '2.5cm',
        left: '2cm'
      },
      // Configurações otimizadas
      scale: 1,
      quality: 85, // Reduzido de 100 para 85 (melhor balance qualidade/tamanho)
      compress: true
    });

    // Fechar página para liberar memória
    await page.close();

    const endTime = performance.now();
    const puppeteerTime = endTime - startTime;

    console.log(`[PDF Generator] PDF gerado com sucesso em ${puppeteerTime.toFixed(2)}ms`);
    console.log(`[PDF Generator] Tamanho do PDF: ${(pdf.length / 1024 / 1024).toFixed(2)} MB`);

    return pdf;

  } catch (error) {
    console.error("[PDF Generator] Erro ao gerar PDF:", error);
    console.error("[PDF Generator] Stack trace:", error instanceof Error ? error.stack : 'N/A');
    console.error("[PDF Generator] Tipo do erro:", typeof error);

    // Log específico para diferentes tipos de erro
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        console.error("[PDF Generator] ERRO DE TIMEOUT - Processo demorou muito para completar");
      } else if (error.message.includes('memory') || error.message.includes('Memory')) {
        console.error("[PDF Generator] ERRO DE MEMÓRIA - Insuficiente para processar o PDF");
      } else if (error.message.includes('browser') || error.message.includes('Puppeteer')) {
        console.error("[PDF Generator] ERRO DO BROWSER - Problema com Puppeteer");
      } else if (error.message.includes('Protocol error')) {
        console.error("[PDF Generator] ERRO DE PROTOCOLO - Conexão com browser perdida");
      }
    }

    throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      // Retornar browser ao pool em vez de fechar
      await puppeteerPool.releaseBrowser(browser);
    }
  }
}

/**
 * Valida se a estrutura do ebook tem o conteúdo adequado para 30 páginas
 */
function validateEbookStructure(structure: EbookStructure): void {
  // Validar número de capítulos
  if (structure.capitulos.length !== 7) {
    throw new Error(`Estrutura inválida: esperado 7 capítulos, encontrado ${structure.capitulos.length}`);
  }

  // Validar contagem de palavras aproximada
  const introWords = structure.introducao.split(' ').length;
  const conclusionWords = structure.conclusao.split(' ').length;

  if (introWords < 600 || introWords > 900) {
    console.warn(`[PDF Generator] Introdução com ${introWords} palavras (esperado: 700-800)`);
  }

  if (conclusionWords < 600 || conclusionWords > 900) {
    console.warn(`[PDF Generator] Conclusão com ${conclusionWords} palavras (esperado: 700-800)`);
  }

  structure.capitulos.forEach((capitulo, index) => {
    const chapterWords = capitulo.conteudo.split(' ').length;
    if (chapterWords < 900 || chapterWords > 1400) {
      console.warn(`[PDF Generator] Capítulo ${index + 1} com ${chapterWords} palavras (esperado: 1050-1200)`);
    }
  });

  const totalWords = introWords + conclusionWords +
    structure.capitulos.reduce((sum, cap) => sum + cap.conteudo.split(' ').length, 0);

  console.log(`[PDF Generator] Total de palavras: ${totalWords} (esperado: 10.500-12.000)`);
}

/**
 * Função principal que gera o ebook completo com métricas
 */
export async function generateCompleteEbook(data: EbookData): Promise<Buffer> {
  const jobId = performanceMetrics.startJob();
  const totalStartTime = performance.now();
  let openaiTime = 0;
  let puppeteerTime = 0;
  let uploadTime = 0;

  // Função para logging com checkpoint
  const logCheckpoint = (checkpoint: string, logData?: any) => {
    const elapsed = performance.now() - totalStartTime;
    console.log(`[${jobId}] PDF_GEN_CHECKPOINT ${checkpoint} (+${elapsed.toFixed(2)}ms):`, logData || '');
  };

  try {
    logCheckpoint("A_INICIO", { nome: data.nome, nicho: data.nicho });

    // 1. Gerar estrutura do ebook (OpenAI)
    logCheckpoint("B_OPENAI_INICIO");
    const openaiStartTime = performance.now();
    let structure;

    try {
      structure = await generateEbookStructure(data);
      openaiTime = performance.now() - openaiStartTime;
      logCheckpoint("B_OPENAI_SUCESSO", {
        time: openaiTime.toFixed(2),
        capitulos: structure.capitulos?.length || 0,
        tituloLength: structure.titulo?.length || 0
      });
    } catch (openaiError) {
      logCheckpoint("B_OPENAI_ERRO", {
        error: openaiError instanceof Error ? openaiError.message : String(openaiError),
        time: (performance.now() - openaiStartTime).toFixed(2)
      });
      throw new Error(`Falha na geração da estrutura OpenAI: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`);
    }

    // 2. Validar estrutura
    logCheckpoint("C_VALIDACAO_INICIO");
    try {
      validateEbookStructure(structure);
      logCheckpoint("C_VALIDACAO_SUCESSO");
    } catch (validationError) {
      logCheckpoint("C_VALIDACAO_ERRO", {
        error: validationError instanceof Error ? validationError.message : String(validationError)
      });
      throw new Error(`Estrutura inválida: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
    }

    // 3. Gerar PDF (Puppeteer)
    logCheckpoint("D_PUPPETEER_INICIO");
    const puppeteerStartTime = performance.now();
    let pdfBuffer;

    try {
      pdfBuffer = await generateEbookPDF(structure);
      puppeteerTime = performance.now() - puppeteerStartTime;
      logCheckpoint("D_PUPPETEER_SUCESSO", {
        time: puppeteerTime.toFixed(2),
        bufferSize: pdfBuffer.length,
        bufferSizeMB: (pdfBuffer.length / 1024 / 1024).toFixed(2)
      });
    } catch (puppeteerError) {
      logCheckpoint("D_PUPPETEER_ERRO", {
        error: puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError),
        time: (performance.now() - puppeteerStartTime).toFixed(2)
      });
      throw new Error(`Falha na geração do PDF Puppeteer: ${puppeteerError instanceof Error ? puppeteerError.message : String(puppeteerError)}`);
    }

    const totalTime = performance.now() - totalStartTime;

    // Registrar métricas de sucesso
    performanceMetrics.endJob(jobId, {
      openaiTime,
      puppeteerTime,
      uploadTime: 0, // Upload é feito na API route
      totalTime
    });

    console.log(`[PDF Generator] Ebook completo gerado com sucesso em ${totalTime.toFixed(2)}ms`);
    console.log(`[PDF Generator] Breakdown: OpenAI: ${openaiTime.toFixed(2)}ms, Puppeteer: ${puppeteerTime.toFixed(2)}ms`);
    console.log(`[PDF Generator] Tamanho do PDF: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    return pdfBuffer;

  } catch (error) {
    console.error("[PDF Generator] Erro na geração completa:", error);

    // Registrar erro nas métricas
    performanceMetrics.recordError(jobId, error instanceof Error ? error : new Error(String(error)));

    throw new Error(`Falha na geração completa do ebook: ${error instanceof Error ? error.message : String(error)}`);
  }
}
