"use strict";
"use server";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleOpenAIUsage = exampleOpenAIUsage;
const openai_service_1 = require("../openai-service");
async function exampleOpenAIUsage() {
    try {
        const simpleText = await (0, openai_service_1.generateText)("Quais são as 3 principais estratégias de marketing digital para produtos online?", "Você é um especialista em marketing digital. Seja conciso e direto.");
        console.log("Texto gerado:", simpleText);
        const nichoContent = await (0, openai_service_1.generateNichoContent)("Marketing Digital");
        console.log("Conteúdo do nicho:", nichoContent);
        return {
            success: true,
            simpleText,
            nichoContent,
        };
    }
    catch (error) {
        console.error("Erro no exemplo:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erro desconhecido",
        };
    }
}
