// Teste rápido da função de extração de subnichos
const { extrairSubnichosValidos } = require('./dist/lib/openai-service.js');

// Simular resposta da OpenAI com JSON malformado
const respostaMalformada = `
Aqui estão os subnichos para Marketing Digital:

{
  "id": "subnicho_1",
  "nome": "Marketing de Afiliados",
  "pesquisasMensais": 25000,
  "cpc": 3.20,
  "palavrasChave": ["marketing afiliados", "como ser afiliado", "ganhar dinheiro afiliados"],
  "termosPesquisa": ["marketing de afiliados", "curso afiliados", "afiliados iniciantes"],
  "potencialRentabilidade": 85
}

{
  "id": "subnicho_2",
  "nome": "Email Marketing",
  "pesquisasMensais": 18000,
  "cpc": 2.80,
  "palavrasChave": ["email marketing", "newsletter", "automação email"],
  "termosPesquisa": ["email marketing curso", "como fazer email marketing", "ferramentas email"],
  "potencialRentabilidade": 78
}

{
  "id": "subnicho_3",
  "nome": "Marketing de Conteúdo",
  "pesquisasMensais": 32000,
  "cpc": 2.50,
  "palavrasChave": ["marketing conteudo", "blog marketing", "content marketing"],
  "termosPesquisa": ["marketing de conteúdo", "estratégia conteúdo", "blog para negócios"],
  "potencialRentabilidade": 82
}
`;

console.log('Testando extração de subnichos...');
console.log('Resposta simulada:', respostaMalformada.substring(0, 200) + '...');

// Testar a função
try {
  const subnichos = extrairSubnichosValidos(respostaMalformada);
  console.log('\n✅ Resultado:');
  console.log(`Subnichos extraídos: ${subnichos.length}`);
  subnichos.forEach((sub, index) => {
    console.log(`${index + 1}. ${sub.nome} (${sub.pesquisasMensais} buscas/mês, CPC: $${sub.cpc})`);
  });
} catch (error) {
  console.error('❌ Erro:', error.message);
}
