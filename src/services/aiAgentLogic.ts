import { AgentWithRelations, AgentStage } from '@/types/agent';

/**
 * Service to handle AI Agent logic, prompt construction and response processing.
 * This can be used in Edge Functions or directly in the client (if using OpenAI SDK).
 */
export const aiAgentLogic = {
    /**
     * Constructs the system prompt for the AI based on agent configuration and current stage.
     */
    buildSystemPrompt(agent: AgentWithRelations, currentStage?: AgentStage, leadData?: any): string {
        let prompt = `Você é ${agent.persona_name || agent.name}.\n`;
        prompt += `Sua função: ${agent.function}\n`;
        prompt += `Diretrizes de comportamento: ${agent.behavior_rules}\n\n`;

        if (currentStage) {
            prompt += `### ETAPA ATUAL: ${currentStage.name}\n`;
            prompt += `Objetivo desta etapa: ${currentStage.objective}\n`;
            prompt += `Critérios para avançar: ${currentStage.success_criteria}\n\n`;
        }

        if (leadData) {
            prompt += `### DADOS DO LEAD ATÉ AGORA:\n${JSON.stringify(leadData, null, 2)}\n\n`;
        }

        if (agent.knowledge_content) {
            prompt += `### BASE DE CONHECIMENTO:\n${agent.knowledge_content}\n\n`;
        }

        prompt += `Responda de forma natural, mantendo a persona. `;
        prompt += `Se todos os objetivos da etapa atual forem atingidos, termine sua resposta com [AVANÇAR_ETAPA]. `;
        prompt += `Extraia informações relevantes no formato JSON se encontrar dados novos (como nome, email, interesse).`;

        return prompt;
    },

    /**
     * Parses the AI response to extract collected variables and stage advancement signals.
     */
    parseAIResponse(response: string) {
        const shouldAdvance = response.includes('[AVANÇAR_ETAPA]');
        const cleanResponse = response.replace('[AVANÇAR_ETAPA]', '').trim();

        // Simple regex or logic to extract JSON-like data if present
        // This is a placeholder for a more robust parser
        const jsonMatch = response.match(/\{.*\}/s);
        let extractedData = null;
        if (jsonMatch) {
            try {
                extractedData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Failed to parse extracted JSON from AI", e);
            }
        }

        return {
            message: cleanResponse,
            shouldAdvance,
            extractedData
        };
    }
};
