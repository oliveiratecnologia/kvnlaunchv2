// Configuração da API da OpenAI
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY
export const OPENAI_MODEL = "gpt-4o-mini" // Modelo GPT-4o mini
export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
export const OPENAI_MAX_TOKENS = 1500 // Otimizado para resposta mais rápida
export const OPENAI_TEMPERATURE = 0.7 // Ajuste conforme necessário
export const OPENAI_TIMEOUT = 60000 // 60 segundos timeout
export const OPENAI_MAX_RETRIES = 2 // Máximo de tentativas
