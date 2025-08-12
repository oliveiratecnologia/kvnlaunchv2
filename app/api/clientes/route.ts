import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { ClienteCadastroData, ClienteCadastroResponse } from '@/types/cliente'

export async function POST(request: NextRequest) {
  try {
    const body: ClienteCadastroData = await request.json()

    // Validação básica dos dados
    if (!body.nomeCompleto || !body.email || !body.telefone || !body.instagram || !body.monetizacao) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Todos os campos são obrigatórios' 
        },
        { status: 400 }
      )
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'E-mail inválido' 
        },
        { status: 400 }
      )
    }

    // Inserir cliente na tabela
    const { data, error } = await supabase
      .from('clientes')
      .insert([
        {
          nome_completo: body.nomeCompleto.trim(),
          email: body.email.trim().toLowerCase(),
          telefone: body.telefone.trim(),
          instagram: body.instagram.trim(),
          monetizacao: body.monetizacao.trim(),
          status: 'active'
        }
      ])
      .select('id')
      .single()

    if (error) {
      console.error('Erro ao inserir cliente:', error)
      
      // Verificar se é erro de e-mail duplicado
      if (error.code === '23505' && error.message.includes('email')) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.' 
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro interno do servidor. Tente novamente.' 
        },
        { status: 500 }
      )
    }

    const response: ClienteCadastroResponse = {
      success: true,
      clienteId: data.id,
      message: 'Cliente cadastrado com sucesso'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Erro na API de clientes:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'E-mail é obrigatório' 
        },
        { status: 400 }
      )
    }

    // Buscar cliente por e-mail
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao buscar cliente:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro interno do servidor' 
        },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Cliente não encontrado' 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      cliente: data
    })

  } catch (error) {
    console.error('Erro na API de clientes (GET):', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}
