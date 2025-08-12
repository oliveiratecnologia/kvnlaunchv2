import { NextResponse, type NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Interface para tipagem (opcional, mas recomendado)
interface Produto {
  id: string
  created_at: string
  niche: string | null
  sub_niche: string | null
  product_name: string | null
  description: string | null
  persona_demographics: string | null
  persona_online_behavior: string | null
  persona_motivations: string | null
  persona_pain_points: string | null
  persona_goals: string | null
  persona_objections: string | null
  persona_acquisition_channels: string | null
  sale_value: number | null
  sales_copy: string | null
  upsell_product_name: string | null
  upsell_description: string | null
  upsell_sales_copy: string | null
  upsell_sale_value: number | null
  downsell_product_name: string | null
  downsell_description: string | null
  downsell_sales_copy: string | null
  downsell_sale_value: number | null
  order_bumps_data: any | null // Ou um tipo mais específico se souber a estrutura
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params // Extrai o ID da URL

    // Busca o produto no Supabase
    const { data: produto, error } = await supabase
      .from('products') // Nome da tabela
      .select('*')      // Seleciona todas as colunas
      .eq('id', productId) // Filtra pelo ID
      .single() // Espera um único resultado

    // Verifica se houve erro na query
    if (error) {
      // Se o erro for "PGRST116" (Row not found), retorna 404
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 })
      }
      // Para outros erros do Supabase, loga e retorna 500
      console.error("Erro ao buscar produto no Supabase:", error);
      return NextResponse.json({ message: 'Erro ao buscar produto no banco de dados' }, { status: 500 })
    }

    // Se o produto for encontrado, retorna 200 com os dados do produto
    return NextResponse.json(produto as Produto, { status: 200 })

  } catch (error) {
    console.error("Erro interno no endpoint:", error);
    // Em caso de erro inesperado no código do endpoint, retorna 500
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 })
  }
} 