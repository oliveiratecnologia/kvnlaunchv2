import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export interface AuthUser {
  id: string
  email: string
}

export async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey) {
    return false
  }
  
  const validApiKey = process.env.API_SECRET_KEY
  
  if (!validApiKey) {
    console.error('API_SECRET_KEY não configurada no ambiente')
    return false
  }
  
  return apiKey === validApiKey
}

export async function validateBearerToken(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    
    if (!payload.id || !payload.email) {
      return null
    }
    
    return {
      id: payload.id,
      email: payload.email
    }
  } catch (error) {
    console.error('Erro ao validar token:', error)
    return null
  }
}

export function createAuthResponse(message: string, status: number = 401) {
  return NextResponse.json(
    { 
      success: false, 
      message,
      error: 'UNAUTHORIZED'
    },
    { status }
  )
}