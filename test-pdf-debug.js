// Teste específico para debugging do erro de PDF
// Produto: "Dominando o Mercado de Ações"

const testData = {
  nome: "Dominando o Mercado de Ações",
  descricao: "Um guia completo para iniciantes e intermediários que desejam aprender a investir no mercado de ações de forma inteligente e lucrativa. Aprenda estratégias comprovadas, análise técnica e fundamentalista, gestão de risco e como construir um portfólio diversificado.",
  nicho: "Finanças Pessoais",
  subnicho: "Investimentos em Ações",
  persona: {
    nome: "Carlos Silva",
    idade: 35,
    profissao: "Analista Financeiro",
    renda: "R$ 8.000/mês",
    objetivos: ["Aumentar patrimônio", "Independência financeira", "Aposentadoria antecipada"],
    dores: ["Medo de perder dinheiro", "Falta de conhecimento técnico", "Volatilidade do mercado"],
    comportamento: "Conservador mas interessado em aprender",
    canaisPreferidos: ["YouTube", "Blogs especializados", "Cursos online"]
  }
};

console.log('=== TESTE DE DEBUG PDF ===');
console.log('Produto:', testData.nome);
console.log('Nicho:', testData.nicho);
console.log('Subnicho:', testData.subnicho);
console.log('Descrição length:', testData.descricao.length);
console.log('Tem persona:', !!testData.persona);

// Simular dados que seriam enviados para a Action
const actionInput = {
  nome: testData.nome,
  descricao: testData.descricao,
  nicho: testData.nicho,
  subnicho: testData.subnicho,
  persona: testData.persona
};

console.log('\n=== DADOS PARA ACTION ===');
console.log(JSON.stringify(actionInput, null, 2));

// Verificar se há caracteres especiais que podem causar problemas
const specialChars = /[^\w\s\-.,!?()áéíóúâêîôûàèìòùãõç]/gi;
const hasSpecialChars = specialChars.test(testData.nome + testData.descricao);

console.log('\n=== ANÁLISE DE CARACTERES ===');
console.log('Tem caracteres especiais:', hasSpecialChars);
if (hasSpecialChars) {
  console.log('Caracteres encontrados:', (testData.nome + testData.descricao).match(specialChars));
}

// Verificar tamanho dos dados
const totalSize = JSON.stringify(actionInput).length;
console.log('\n=== ANÁLISE DE TAMANHO ===');
console.log('Tamanho total JSON:', totalSize, 'bytes');
console.log('Tamanho em KB:', (totalSize / 1024).toFixed(2), 'KB');

console.log('\n=== PRÓXIMOS PASSOS ===');
console.log('1. Copie os dados acima e teste manualmente na Action');
console.log('2. Verifique os logs de checkpoint no console');
console.log('3. Identifique em qual checkpoint o erro ocorre');
console.log('4. Analise o tipo específico do erro');

// Função para testar a Action (comentada para não executar automaticamente)
/*
async function testAction() {
  try {
    console.log('\n=== TESTANDO ACTION ===');
    const { gerarEbookPDFAction } = require('./dist/lib/actions/geracao-actions.js');
    const result = await gerarEbookPDFAction(actionInput);
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}
*/
