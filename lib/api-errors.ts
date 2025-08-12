import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  RATE_LIMIT = 'RATE_LIMIT'
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static validationError(details: any) {
    return new ApiError(
      ErrorCode.VALIDATION_ERROR,
      'Dados inválidos',
      400,
      details
    )
  }

  static notFound(resource: string) {
    return new ApiError(
      ErrorCode.NOT_FOUND,
      `${resource} não encontrado`,
      404
    )
  }

  static unauthorized(message = 'Não autorizado') {
    return new ApiError(
      ErrorCode.UNAUTHORIZED,
      message,
      401
    )
  }

  static forbidden(message = 'Acesso negado') {
    return new ApiError(
      ErrorCode.FORBIDDEN,
      message,
      403
    )
  }

  static conflict(message: string) {
    return new ApiError(
      ErrorCode.CONFLICT,
      message,
      409
    )
  }

  static badRequest(message: string) {
    return new ApiError(
      ErrorCode.BAD_REQUEST,
      message,
      400
    )
  }

  static internalError(message = 'Erro interno do servidor') {
    return new ApiError(
      ErrorCode.INTERNAL_ERROR,
      message,
      500
    )
  }

  static rateLimit(message = 'Muitas requisições. Tente novamente mais tarde.') {
    return new ApiError(
      ErrorCode.RATE_LIMIT,
      message,
      429
    )
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Dados inválidos',
          details: error.issues
        }
      },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: isDev ? error.message : 'Erro interno do servidor',
          ...(isDev && { stack: error.stack })
        }
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Erro desconhecido'
      }
    },
    { status: 500 }
  )
}

export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status }
  )
}