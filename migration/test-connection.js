/**
 * 🧪 SCRIPT DE TESTE DA CONEXÃO COM NOVO SUPABASE
 * 
 * Execute este script para verificar se:
 * 1. O arquivo .env.local está configurado corretamente
 * 2. A conexão com o novo Supabase funciona
 * 3. A tabela products foi criada com sucesso
 * 
 * Como executar:
 * node migration/test-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🧪 TESTANDO CONEXÃO COM NOVO SUPABASE...\n');
  
  // Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  console.log('📋 VERIFICAÇÃO DAS VARIÁVEIS:');
  console.log(`✅ SUPABASE_URL: ${supabaseUrl ? '✓ Configurada' : '❌ Não encontrada'}`);
  console.log(`✅ SUPABASE_KEY: ${supabaseKey ? '✓ Configurada' : '❌ Não encontrada'}`);
  console.log(`✅ OPENAI_KEY: ${openaiKey ? (openaiKey.startsWith('sk-') ? '✓ Configurada' : '⚠️  Formato inválido') : '❌ Não encontrada'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ ERRO: Variáveis de ambiente não configuradas!');
    console.log('Verifique se o arquivo .env.local foi criado corretamente.');
    return;
  }
  
  try {
    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão básica
    console.log('\n🔗 TESTANDO CONEXÃO...');
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      console.log('❌ ERRO DE CONEXÃO:', error.message);
      
      if (error.message.includes('relation "public.products" does not exist')) {
        console.log('\n💡 SOLUÇÃO: A tabela "products" não existe ainda.');
        console.log('Execute o script migration/01-schema.sql no Supabase Dashboard.');
      }
      return;
    }
    
    // Testar estrutura da tabela
    console.log('✅ Conexão bem-sucedida!');
    console.log('\n📊 TESTANDO ESTRUTURA DA TABELA...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.log('⚠️  Erro ao verificar estrutura:', tableError.message);
    } else {
      console.log('✅ Tabela products criada com sucesso!');
    }
    
    // Contar registros
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📈 Registros na tabela: ${count || 0}`);
    
    console.log('\n🎉 TUDO FUNCIONANDO PERFEITAMENTE!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Execute o backup dos dados antigos');
    console.log('2. Execute a migração dos dados');
    console.log('3. Teste a aplicação completa');
    
  } catch (err) {
    console.log('❌ ERRO INESPERADO:', err.message);
  }
}

testConnection();
