import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic' // Garante que a rota seja sempre dinâmica

// Define o tipo esperado para os parâmetros da rota (Next.js 15)
type RouteParams = {
  params: Promise<{
    uuid: string
  }>
}

// Função GET que recebe a requisição e os parâmetros da rota
export async function GET(request: Request, { params }: RouteParams) {
  const { uuid } = await params

  console.log(`[API /api/products/${uuid}] Received request`);

  // Verifica se o UUID foi fornecido
  if (!uuid) {
    console.warn('[API /api/products/uuid] UUID parameter is missing');
    return NextResponse.json({ error: 'Product UUID is required' }, { status: 400 })
  }

  // Opcional: Adicionar validação básica do formato UUID aqui se necessário

  try {
    console.log(`[API /api/products/${uuid}] Querying Supabase for ID: ${uuid}`);
    // Busca um único produto pelo ID (UUID)
    const { data, error } = await supabase
      .from('products')
      .select('*') // Seleciona todas as colunas
      .eq('id', uuid) // Filtra pelo ID igual ao UUID fornecido
      .single() // Espera exatamente um resultado

    // Se houver um erro na consulta ao Supabase
    if (error) {
      console.error(`[API /api/products/${uuid}] Supabase error:`, error);
      // Verifica se o erro é especificamente "Não encontrado" pelo uso do .single()
      if (error.code === 'PGRST116') { // Código PostgREST para "Not Found" com .single()
         console.log(`[API /api/products/${uuid}] Product not found in database.`);
         return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      // Para outros erros do banco
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      )
    }

    // Se não houve erro, mas data é null/undefined (segurança extra)
    if (!data) {
      console.warn(`[API /api/products/${uuid}] Product not found (data is null/undefined after query success).`);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    console.log(`[API /api/products/${uuid}] Product found, returning data.`);
    // Retorna os dados do produto encontrado
    return NextResponse.json(data)

  } catch (err) {
    // Captura qualquer outro erro inesperado
    console.error(`[API /api/products/${uuid}] Unexpected server error:`, err)
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
} 