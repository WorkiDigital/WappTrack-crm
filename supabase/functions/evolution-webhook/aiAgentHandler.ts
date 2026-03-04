import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export async function handleAgentLogic(params: {
    supabase: any;
    lead: any;
    messageContent: string;
    instanceName: string;
    realPhoneNumber: string;
}) {
    const { supabase, lead, messageContent, instanceName, realPhoneNumber } = params;

    // 1. Check for triggers if lead doesn't have an agent assigned
    if (!lead.agent_id) {
        const { data: trigger } = await supabase
            .from('agent_triggers')
            .select('agent_id')
            .ilike('phrase', `%${messageContent.trim().toLowerCase()}%`)
            .limit(1)
            .single();

        if (trigger) {
            console.log(`🤖 Trigger matched! Assigning agent ${trigger.agent_id} to lead ${lead.id}`);
            const { error: updateError } = await supabase
                .from('leads')
                .update({ agent_id: trigger.agent_id })
                .eq('id', lead.id);

            if (updateError) {
                console.error("Error updates lead agent_id:", updateError);
                return;
            }

            // Update local lead object for subsequent logic
            lead.agent_id = trigger.agent_id;
        }
    }

    // 2. If lead has an agent, process with AI
    if (lead.agent_id) {
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select(`
                *, 
                stages:agent_stages(
                    *, 
                    stage_variables(*), 
                    stage_examples(*)
                ),
                agent_knowledge_bases(
                    is_enabled,
                    knowledge_bases(*)
                )
            `)
            .eq('id', lead.agent_id)
            .single();

        if (agentError || !agent || !agent.is_active) {
            console.log(`🤖 Agent ${lead.agent_id} not found or inactive.`);
            return;
        }

        console.log(`🤖 Processing message with agent: ${agent.name}`);

        // Get current stage info
        const currentStage = agent.stages.find((s: any) => s.id === lead.current_stage_id) ||
            agent.stages.sort((a: any, b: any) => a.stage_order - b.stage_order)[0];

        // Build system prompt
        let systemPrompt = `Você é ${agent.persona_name || agent.name}.\n`;
        systemPrompt += `Sua função: ${agent.function}\n`;
        systemPrompt += `Diretrizes de comportamento: ${agent.behavior_rules}\n\n`;

        if (currentStage) {
            systemPrompt += `### ETAPA ATUAL: ${currentStage.name}\n`;
            systemPrompt += `Objetivo desta etapa: ${currentStage.objective}\n`;
            systemPrompt += `Critérios de sucesso: ${currentStage.success_criteria}\n\n`;

            if (currentStage.stage_variables && currentStage.stage_variables.length > 0) {
                systemPrompt += `### DADOS QUE VOCÊ DEVE COLETAR NESTA ETAPA:\n`;
                currentStage.stage_variables.forEach((v: any) => {
                    systemPrompt += `- ${v.field_name}: ${v.description} (${v.is_required ? 'OBRIGATÓRIO' : 'Opcional'})\n`;
                });
                systemPrompt += `\n`;
            }
        }

        if (lead.collected_variables) {
            systemPrompt += `### DADOS COLETADOS:\n${JSON.stringify(lead.collected_variables, null, 2)}\n\n`;
        }

        if (agent.knowledge_content) {
            systemPrompt += `### CONHECIMENTO ESPECÍFICO:\n${agent.knowledge_content}\n\n`;
        }

        // Include linked knowledge bases
        const linkedKBs = agent.agent_knowledge_bases
            ?.filter((akb: any) => akb.is_enabled && akb.knowledge_bases)
            .map((akb: any) => akb.knowledge_bases.content)
            .join('\n\n');

        if (linkedKBs) {
            systemPrompt += `### BASE DE CONHECIMENTO COMPARTILHADA:\n${linkedKBs}\n\n`;
        }

        // Include Lead Info & UTMs
        systemPrompt += `### INFORMAÇÕES DO LEAD:\n`;
        systemPrompt += `- Origem (UTM Source): ${lead.utm_source || 'Direto/Orgânico'}\n`;
        systemPrompt += `- Campanha (UTM Campaign): ${lead.utm_campaign || 'Nenhuma'}\n`;
        if (lead.location) systemPrompt += `- Localização: ${lead.location}\n`;
        if (lead.collected_variables) {
            systemPrompt += `- Dados já coletados: ${JSON.stringify(lead.collected_variables)}\n`;
        }
        systemPrompt += `\n`;

        systemPrompt += `Responda o lead de forma natural e empática. Mantenha a persona.\n`;
        systemPrompt += `Instruções de Saída:\n`;
        systemPrompt += `1. Se atingir os critérios de sucesso desta etapa, inclua [AVANÇAR_ETAPA] no final.\n`;
        systemPrompt += `2. Se extrair novos dados (como nome, email), inclua um bloco JSON como: [DATA:{"nome": "Fulano"}]\n`;

        // Call OpenAI (GPT-4o-mini)
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            console.warn("⚠️ OPENAI_API_KEY not configured. Skipping AI response.");
            return;
        }

        // Fetch conversation history (last 10 messages)
        const { data: history } = await supabase
            .from('lead_messages')
            .select('message_text, is_from_me')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false })
            .limit(10);

        const messages = [
            { role: "system", content: systemPrompt },
            ...(history || []).reverse().map((m: any) => ({
                role: m.is_from_me ? "assistant" : "user",
                content: m.message_text
            })),
            { role: "user", content: messageContent }
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openaiApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }

            const aiData = await response.json();
            const aiResponse = aiData.choices[0].message.content;

            // Parse AI response for metadata
            const shouldAdvance = aiResponse.includes('[AVANÇAR_ETAPA]');
            const dataMatch = aiResponse.match(/\[DATA:(.*?)\]/);
            let extractedData: any = {};
            if (dataMatch) {
                try {
                    extractedData = JSON.parse(dataMatch[1]);
                } catch (e) {
                    console.error("Failed to parse AI data JSON", e);
                }
            }

            const cleanResponse = aiResponse
                .replace('[AVANÇAR_ETAPA]', '')
                .replace(/\[DATA:.*?\]/, '')
                .trim();

            // Send response via Evolution
            await sendThroughEvolution({
                supabase,
                instanceName,
                phone: realPhoneNumber,
                message: cleanResponse,
                leadId: lead.id
            });

            // Update lead state
            const updateData: any = {
                collected_variables: { ...(lead.collected_variables || {}), ...extractedData }
            };

            // SYNC: Map extracted data to lead columns if they match
            if (extractedData.nome || extractedData.name) updateData.name = extractedData.nome || extractedData.name;
            if (extractedData.email) updateData.email = extractedData.email;
            if (extractedData.phone || extractedData.telefone) updateData.phone = extractedData.phone || extractedData.telefone;

            if (shouldAdvance && currentStage) {
                const stages = [...(agent.stages || [])].sort((a: any, b: any) => a.stage_order - b.stage_order);
                const nextStage = stages.find((s: any) => s.stage_order === currentStage.stage_order + 1);

                if (nextStage) {
                    updateData.current_stage_id = nextStage.id;

                    // SYNC: Update lead status based on stage funnel_status
                    if (nextStage.funnel_status) {
                        updateData.status = nextStage.funnel_status;
                        console.log(`🤖 Advancing lead ${lead.id} to stage: ${nextStage.name} (Status: ${nextStage.funnel_status})`);

                        // SYNC: Trigger Facebook CAPI if status is 'won', 'qualified', or 'demo'
                        const conversionStatuses = ['won', 'qualified', 'demo', 'converted'];
                        if (conversionStatuses.includes(nextStage.funnel_status) && lead.campaigns) {
                            const campaign = lead.campaigns;
                            if (campaign.pixel_id && campaign.facebook_access_token) {
                                console.log(`🚀 Triggering CAPI for lead ${lead.id} (Status: ${nextStage.funnel_status})`);
                                try {
                                    await supabase.functions.invoke('facebook-conversions', {
                                        body: {
                                            pixelId: campaign.pixel_id,
                                            accessToken: campaign.facebook_access_token,
                                            eventName: 'Lead', // or mapping based on status
                                            testEventCode: campaign.test_event_code,
                                            userData: {
                                                phone: realPhoneNumber,
                                                fbc: lead.collected_variables?.fbclid,
                                                fbp: lead.collected_variables?.fbp,
                                                clientIp: lead.ip_address,
                                                userAgent: lead.browser
                                            },
                                            customData: {
                                                lead_id: lead.id,
                                                status: nextStage.funnel_status
                                            }
                                        }
                                    });
                                } catch (capiErr) {
                                    console.error("Error triggering CAPI from Agent:", capiErr);
                                }
                            }
                        }
                    }
                }
            } else if (!lead.current_stage_id && currentStage) {
                updateData.current_stage_id = currentStage.id;
                if (currentStage.funnel_status) updateData.status = currentStage.funnel_status;
            }

            await supabase
                .from('leads')
                .update(updateData)
                .eq('id', lead.id);

        } catch (error) {
            console.error("💥 AI processing error:", error);
        }
    }
}

// Helper to send message through Evolution API (similar to evolution-send-message)
async function sendThroughEvolution(params: {
    supabase: any;
    instanceName: string;
    phone: string;
    message: string;
    leadId: string;
}) {
    const { supabase, instanceName, phone, message, leadId } = params;

    // Get instance config
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

    if (!instance) return;

    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL') || instance.base_url || "https://evoapi.workidigital.tech";

    try {
        const response = await fetch(`${evolutionBaseUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': evolutionApiKey || ''
            },
            body: JSON.stringify({
                number: phone,
                text: message
            })
        });

        if (response.ok) {
            const evolutionData = await response.json();

            // Save outgoing message to lead_messages
            await supabase
                .from('lead_messages')
                .insert({
                    lead_id: leadId,
                    message_text: message,
                    is_from_me: true,
                    status: 'sent',
                    whatsapp_message_id: evolutionData.key?.id || null,
                    instance_name: instanceName
                });

            // Update lead summary
            await supabase
                .from('leads')
                .update({
                    last_contact_date: new Date().toISOString(),
                    last_message: message,
                    evolution_status: 'sent'
                })
                .eq('id', leadId);
        }
    } catch (error) {
        console.error("Error sending Evolution message:", error);
    }
}
