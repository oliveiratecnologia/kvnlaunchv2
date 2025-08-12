import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { clienteCadastroSchema, clienteBuscaSchema } from '@/lib/schemas/cliente.schema'
import { ApiError, handleApiError, createSuccessResponse } from '@/lib/api-errors'
import { validateApiKey } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateApiKey(request)
    if (!isValid) {
      throw ApiError.unauthorized('API key inválida ou ausente')
    }

    const body = await request.json()
    const validatedData = clienteCadastroSchema.parse(body)

    const { data, error } = await supabase
      .from('clientes')
      .insert([
        {
          nome_completo: validatedData.nomeCompleto,
          email: validatedData.email,
          telefone: validatedData.telefone,
          instagram: validatedData.instagram,
          monetizacao: validatedData.monetizacao,
          status: 'active'
        }
      ])
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505' && error.message.includes('email')) {
        throw ApiError.conflict('Este e-mail já está cadastrado')
      }
      throw error
    }

    return createSuccessResponse(
      { clienteId: data.id },
      'Cliente cadastrado com sucesso',
      201
    )

  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const isValid = await validateApiKey(request)
    if (!isValid) {
      throw ApiError.unauthorized('API key inválida ou ausente')
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    const validatedData = clienteBuscaSchema.parse({ email })

    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome_completo, email, telefone, instagram, monetizacao, created_at')
      .eq('email', validatedData.email)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) {
      throw ApiError.notFound('Cliente')
    }

    return createSuccessResponse(data)

  } catch (error) {
    return handleApiError(error)
  }
}