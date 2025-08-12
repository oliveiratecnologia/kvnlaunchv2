"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEbookStructure = generateEbookStructure;
exports.generateEbookHTML = generateEbookHTML;
exports.generateEbookPDF = generateEbookPDF;
exports.generateCompleteEbook = generateCompleteEbook;
const openai_service_1 = require("./openai-service");
const rate_limiter_1 = require("./rate-limiter");
async function generateEbookStructure(data) {
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
}`;
    try {
        console.log(`[PDF Generator] Gerando estrutura do ebook: ${data.nome}`);
        const response = await (0, openai_service_1.generateText)(prompt, systemPrompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Estrutura JSON não encontrada na resposta");
        }
        const structure = JSON.parse(jsonMatch[0]);
        if (!structure.titulo || !structure.introducao || !structure.capitulos || structure.capitulos.length === 0) {
            throw new Error("Estrutura do ebook incompleta");
        }
        console.log(`[PDF Generator] Estrutura gerada com ${structure.capitulos.length} capítulos`);
        return structure;
    }
    catch (error) {
        console.error("[PDF Generator] Erro ao gerar estrutura:", error);
        throw new Error(`Falha ao gerar estrutura do ebook: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function generateEbookHTML(structure) {
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
        const startPage = 3 + (index * 4);
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
function formatContent(content) {
    return content
        .split('\n\n')
        .filter(paragraph => paragraph.trim().length > 0)
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('\n');
}
function formatContentWithFirstParagraph(content) {
    const paragraphs = content
        .split('\n\n')
        .filter(paragraph => paragraph.trim().length > 0);
    if (paragraphs.length === 0)
        return '';
    const formattedParagraphs = paragraphs.map((paragraph, index) => {
        const trimmed = paragraph.trim();
        if (trimmed.endsWith(':') && trimmed.length < 100) {
            return `<h3>${trimmed}</h3>`;
        }
        if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/)) {
            return `<p class="no-indent">${trimmed}</p>`;
        }
        if (index === 0) {
            return `<p class="first-paragraph no-indent">${trimmed}</p>`;
        }
        return `<p>${trimmed}</p>`;
    });
    return formattedParagraphs.join('\n');
}
async function generateEbookPDF(structure) {
    let browser;
    const startTime = performance.now();
    try {
        console.log(`[PDF Generator] Iniciando geração de PDF para: ${structure.titulo}`);
        browser = await rate_limiter_1.puppeteerPool.getBrowser();
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1600 });
        const html = generateEbookHTML(structure);
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 45000
        });
        await page.waitForTimeout(1500);
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
            scale: 1,
            quality: 85,
            compress: true
        });
        await page.close();
        const endTime = performance.now();
        const puppeteerTime = endTime - startTime;
        console.log(`[PDF Generator] PDF gerado com sucesso em ${puppeteerTime.toFixed(2)}ms`);
        console.log(`[PDF Generator] Tamanho do PDF: ${(pdf.length / 1024 / 1024).toFixed(2)} MB`);
        return pdf;
    }
    catch (error) {
        console.error("[PDF Generator] Erro ao gerar PDF:", error);
        throw new Error(`Falha ao gerar PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
        if (browser) {
            await rate_limiter_1.puppeteerPool.releaseBrowser(browser);
        }
    }
}
function validateEbookStructure(structure) {
    if (structure.capitulos.length !== 7) {
        throw new Error(`Estrutura inválida: esperado 7 capítulos, encontrado ${structure.capitulos.length}`);
    }
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
async function generateCompleteEbook(data) {
    const jobId = rate_limiter_1.performanceMetrics.startJob();
    const totalStartTime = performance.now();
    let openaiTime = 0;
    let puppeteerTime = 0;
    let uploadTime = 0;
    try {
        console.log(`[PDF Generator] Iniciando geração completa do ebook: ${data.nome} (Job: ${jobId})`);
        const openaiStartTime = performance.now();
        const structure = await generateEbookStructure(data);
        openaiTime = performance.now() - openaiStartTime;
        console.log(`[PDF Generator] Estrutura gerada em ${openaiTime.toFixed(2)}ms`);
        validateEbookStructure(structure);
        const puppeteerStartTime = performance.now();
        const pdfBuffer = await generateEbookPDF(structure);
        puppeteerTime = performance.now() - puppeteerStartTime;
        console.log(`[PDF Generator] PDF gerado em ${puppeteerTime.toFixed(2)}ms`);
        const totalTime = performance.now() - totalStartTime;
        rate_limiter_1.performanceMetrics.endJob(jobId, {
            openaiTime,
            puppeteerTime,
            uploadTime: 0,
            totalTime
        });
        console.log(`[PDF Generator] Ebook completo gerado com sucesso em ${totalTime.toFixed(2)}ms`);
        console.log(`[PDF Generator] Breakdown: OpenAI: ${openaiTime.toFixed(2)}ms, Puppeteer: ${puppeteerTime.toFixed(2)}ms`);
        console.log(`[PDF Generator] Tamanho do PDF: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        return pdfBuffer;
    }
    catch (error) {
        console.error("[PDF Generator] Erro na geração completa:", error);
        rate_limiter_1.performanceMetrics.recordError(jobId, error instanceof Error ? error : new Error(String(error)));
        throw new Error(`Falha na geração completa do ebook: ${error instanceof Error ? error.message : String(error)}`);
    }
}
