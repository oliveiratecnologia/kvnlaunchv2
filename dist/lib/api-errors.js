"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = exports.ErrorCode = void 0;
exports.handleApiError = handleApiError;
exports.createSuccessResponse = createSuccessResponse;
const server_1 = require("next/server");
const zod_1 = require("zod");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["CONFLICT"] = "CONFLICT";
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["BAD_REQUEST"] = "BAD_REQUEST";
    ErrorCode["RATE_LIMIT"] = "RATE_LIMIT";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
class ApiError extends Error {
    constructor(code, message, statusCode, details) {
        super(message);
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
    }
    static validationError(details) {
        return new ApiError(ErrorCode.VALIDATION_ERROR, 'Dados inválidos', 400, details);
    }
    static notFound(resource) {
        return new ApiError(ErrorCode.NOT_FOUND, `${resource} não encontrado`, 404);
    }
    static unauthorized(message = 'Não autorizado') {
        return new ApiError(ErrorCode.UNAUTHORIZED, message, 401);
    }
    static forbidden(message = 'Acesso negado') {
        return new ApiError(ErrorCode.FORBIDDEN, message, 403);
    }
    static conflict(message) {
        return new ApiError(ErrorCode.CONFLICT, message, 409);
    }
    static badRequest(message) {
        return new ApiError(ErrorCode.BAD_REQUEST, message, 400);
    }
    static internalError(message = 'Erro interno do servidor') {
        return new ApiError(ErrorCode.INTERNAL_ERROR, message, 500);
    }
    static rateLimit(message = 'Muitas requisições. Tente novamente mais tarde.') {
        return new ApiError(ErrorCode.RATE_LIMIT, message, 429);
    }
}
exports.ApiError = ApiError;
function handleApiError(error) {
    console.error('API Error:', error);
    if (error instanceof ApiError) {
        return server_1.NextResponse.json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: error.details
            }
        }, { status: error.statusCode });
    }
    if (error instanceof zod_1.ZodError) {
        return server_1.NextResponse.json({
            success: false,
            error: {
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Dados inválidos',
                details: error.errors
            }
        }, { status: 400 });
    }
    if (error instanceof Error) {
        const isDev = process.env.NODE_ENV === 'development';
        return server_1.NextResponse.json({
            success: false,
            error: {
                code: ErrorCode.INTERNAL_ERROR,
                message: isDev ? error.message : 'Erro interno do servidor',
                ...(isDev && { stack: error.stack })
            }
        }, { status: 500 });
    }
    return server_1.NextResponse.json({
        success: false,
        error: {
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Erro desconhecido'
        }
    }, { status: 500 });
}
function createSuccessResponse(data, message, status = 200) {
    return server_1.NextResponse.json({
        success: true,
        message,
        data
    }, { status });
}
