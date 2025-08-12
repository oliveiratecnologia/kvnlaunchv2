"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = validateApiKey;
exports.validateBearerToken = validateBearerToken;
exports.createAuthResponse = createAuthResponse;
const server_1 = require("next/server");
async function validateApiKey(request) {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return false;
    }
    const validApiKey = process.env.API_SECRET_KEY;
    if (!validApiKey) {
        console.error('API_SECRET_KEY não configurada no ambiente');
        return false;
    }
    return apiKey === validApiKey;
}
async function validateBearerToken(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (!payload.id || !payload.email) {
            return null;
        }
        return {
            id: payload.id,
            email: payload.email
        };
    }
    catch (error) {
        console.error('Erro ao validar token:', error);
        return null;
    }
}
function createAuthResponse(message, status = 401) {
    return server_1.NextResponse.json({
        success: false,
        message,
        error: 'UNAUTHORIZED'
    }, { status });
}
