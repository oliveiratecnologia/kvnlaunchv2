import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  niche: z.string().optional(),
  sub_niche: z.string().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  sort: z.enum(['created_at', 'updated_at', 'product_name', 'sale_value']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const params = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      niche: searchParams.get('niche'),
      sub_niche: searchParams.get('sub_niche'),
      status: searchParams.get('status'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order')
    })

    const limit = Math.min(params.limit, 100)
    const offset = (params.page - 1) * limit

    let query = supabase
      .from('products')
      .select('id, created_at, updated_at, niche, sub_niche, product_name, description, sale_value, status', { count: 'exact' })
    
    if (params.niche) {
      query = query.eq('niche', params.niche)
    }
    
    if (params.sub_niche) {
      query = query.eq('sub_niche', params.sub_niche)
    }
    
    if (params.status) {
      query = query.eq('status', params.status)
    }
    
    query = query
      .order(params.sort, { ascending: params.order === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar produtos:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro ao buscar produtos',
          details: error.message 
        },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)
    const hasNextPage = params.page < totalPages
    const hasPrevPage = params.page > 1

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page: params.page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        niche: params.niche,
        sub_niche: params.sub_niche,
        status: params.status
      }
    })

  } catch (err) {
    console.error('Erro na API de produtos:', err)
    
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Parâmetros inválidos',
          details: err.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}