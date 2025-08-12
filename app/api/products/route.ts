import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic' // Garante que a rota seja sempre dinâmica

export async function GET() {
  try {
    // Busca todos os produtos da tabela 'products', ordenados por data de criação descendente
    const { data, error } = await supabase
      .from('products')
      .select('*') // Seleciona todas as colunas
      .order('created_at', { ascending: false }) // Ordena pelos mais recentes primeiro

    // Se houver erro na consulta ao Supabase
    if (error) {
      console.error('Erro ao buscar produtos do Supabase:', error)
      return NextResponse.json(
        { error: 'Erro interno ao buscar produtos', details: error.message },
        { status: 500 }
      )
    }

    // Retorna os dados dos produtos como JSON
    return NextResponse.json(data)

  } catch (err) {
    // Captura qualquer outro erro inesperado
    console.error('Erro inesperado na rota GET /api/products:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 }
    )
  }
} 