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
        // FIX: check if the MESSAGE contains the trigger phrase (not the other way around)
        const { data: triggers } = await supabase
            .from('agent_triggers')
            .select('agent_id, phrase');

        const msgLower = messageContent.trim().toLowerCase();
        const matched = (triggers || []).find((t: any) =>
            msgLower.includes(t.phrase.trim().toLowerCase())
        );

        if (matched) {
            console.log(`🤖 Trigger matched! Assigning agent ${matched.agent_id} to lead ${lead.id}`);
            const { error: updateError } = await supabase
                .from('leads')
                .update({ agent_id: matched.agent_id })
                .eq('id', lead.id);

            if (updateError) {
                console.error("Error updating lead agent_id:", updateError);
                return;
            }

            lead.agent_id = matched.agent_id;
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
            systemPrompt += `Critérios de sucesso (quando atingidos, inclua [AVANÇAR_ETAPA]): ${currentStage.success_criteria}\n`;

            if (currentStage.stage_examples && currentStage.stage_examples.length > 0) {
                const assistantExamples = currentStage.stage_examples.filter((ex: any) => ex.role === 'assistant');
                if (assistantExamples.length > 0) {
                    systemPrompt += `\nExemplos de como você deve responder nesta etapa:\n`;
                    assistantExamples.forEach((ex: any) => {
                        if (ex.message) systemPrompt += `  Você: ${ex.message}\n`;
                    });
                }
            }
            systemPrompt += `\n`;

            if (currentStage.ia_context) {
                systemPrompt += `### INSTRUÇÕES EXTRAS DESTA ETAPA:\n${currentStage.ia_context}\n\n`;
            }

            if (currentStage.stage_variables && currentStage.stage_variables.length > 0) {
                const alreadyCollected = Object.keys(lead.collected_variables || {});
                const pendingVars = currentStage.stage_variables.filter(
                    (v: any) => !alreadyCollected.includes(v.field_name)
                );
                if (pendingVars.length > 0) {
                    systemPrompt += `### DADOS QUE VOCÊ AINDA PRECISA COLETAR NESTA ETAPA:\n`;
                    pendingVars.forEach((v: any) => {
                        const formatHint = getFormatHint(v.field_type);
                        systemPrompt += `- ${v.field_name}: ${v.description} (${v.is_required ? 'OBRIGATÓRIO' : 'Opcional'}${formatHint ? `, formato esperado: ${formatHint}` : ''})\n`;
                    });
                    systemPrompt += `\n`;
                } else {
                    systemPrompt += `### TODOS OS DADOS DESTA ETAPA JÁ FORAM COLETADOS.\n\n`;
                }
            }
        }

        if (lead.collected_variables && Object.keys(lead.collected_variables).length > 0) {
            systemPrompt += `### DADOS JÁ COLETADOS (NÃO PEÇA NOVAMENTE):\n`;
            systemPrompt += `${JSON.stringify(lead.collected_variables, null, 2)}\n\n`;
        }

        if (agent.knowledge_content) {
            systemPrompt += `### CONHECIMENTO ESPECÍFICO:\n${agent.knowledge_content}\n\n`;
        }

        const linkedKBs = agent.agent_knowledge_bases
            ?.filter((akb: any) => akb.is_enabled && akb.knowledge_bases)
            .map((akb: any) => akb.knowledge_bases.content)
            .join('\n\n');

        if (linkedKBs) {
            systemPrompt += `### BASE DE CONHECIMENTO COMPARTILHADA:\n${linkedKBs}\n\n`;
        }

        systemPrompt += `### INFORMAÇÕES DO LEAD:\n`;
        if (lead.name) systemPrompt += `- Nome: ${lead.name}\n`;
        if (lead.email) systemPrompt += `- Email: ${lead.email}\n`;
        if (lead.phone) systemPrompt += `- Telefone: ${lead.phone}\n`;
        systemPrompt += `- Origem: ${lead.utm_source || 'Direto/Orgânico'}\n`;
        systemPrompt += `- Campanha: ${lead.utm_campaign || 'Nenhuma'}\n`;
        if (lead.location) systemPrompt += `- Localização: ${lead.location}\n`;
        systemPrompt += `\n`;

        systemPrompt += `### REGRAS CRÍTICAS:\n`;
        systemPrompt += `- NUNCA repita dados que já foram coletados (veja "DADOS JÁ COLETADOS" acima).\n`;
        systemPrompt += `- NUNCA concatene ou duplique nomes/cargos. Use EXATAMENTE o que o usuário informou.\n`;
        systemPrompt += `- Se o usuário confirmou um dado (disse "sim"), aceite-o sem repetir.\n`;
        systemPrompt += `- Analise o histórico da conversa para entender o que já foi perguntado.\n\n`;

        systemPrompt += `Responda o lead de forma natural e empática. Mantenha a persona.\n`;
        systemPrompt += `Instruções de Saída:\n`;
        systemPrompt += `1. Se atingir os critérios de sucesso desta etapa, inclua [AVANÇAR_ETAPA] no final — mas NUNCA mencione ao lead que está avançando de etapa, mudando de fase ou qualquer coisa do tipo. A transição deve ser completamente invisível para o lead.\n`;
        systemPrompt += `2. SOMENTE quando o usuário informar um dado novo nesta mensagem, inclua ao final (nunca no início ou meio): [DATA:{"campo": "valor"}]. NUNCA inclua [DATA:...] em saudações, apresentações ou quando nenhum dado novo foi informado pelo usuário nesta mensagem.\n`;

        // --- DYNAMIC AI PROVIDER ---
        // Read provider config from company_settings (saved via AiProviderSettings UI)
        const { data: companySettings } = await supabase
            .from('company_settings')
            .select('ai_provider, ai_api_key, ai_model')
            .limit(1)
            .single();

        const aiProvider = companySettings?.ai_provider || 'openai';
        const aiModel = companySettings?.ai_model || 'gpt-4o-mini';
        const aiApiKey = companySettings?.ai_api_key || Deno.env.get('OPENAI_API_KEY') || '';

        if (!aiApiKey) {
            console.warn(`⚠️ No AI API key configured for provider "${aiProvider}". Skipping AI response.`);
            return;
        }

        // Fetch conversation history (last 30 messages), EXCLUDING the current message
        // (processClientMessage already saved it to DB before this runs)
        const { data: history } = await supabase
            .from('lead_messages')
            .select('message_text, is_from_me, created_at')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false })
            .limit(31);

        // Filter out the current message to avoid duplication (normalize whitespace for comparison)
        const normalizedCurrent = messageContent.trim().replace(/\s+/g, ' ');
        const filteredHistory = (history || [])
            .filter((m: any) => {
                if (m.is_from_me) return true;
                const normalizedMsg = (m.message_text || '').trim().replace(/\s+/g, ' ');
                return normalizedMsg !== normalizedCurrent;
            })
            .slice(0, 30)
            .reverse();

        const cleanHistoryText = (text: string) =>
            (text || '').replace(/\[DATA:[\s\S]*?\]/g, '').replace('[AVANÇAR_ETAPA]', '').trim();

        const messages = [
            { role: "system", content: systemPrompt },
            ...filteredHistory.map((m: any) => ({
                role: m.is_from_me ? "assistant" : "user",
                content: cleanHistoryText(m.message_text)
            })),
            { role: "user", content: messageContent }
        ];

        let aiResponse = '';

        try {
            if (aiProvider === 'openai') {
                aiResponse = await callOpenAI(aiApiKey, aiModel, messages);
            } else if (aiProvider === 'anthropic') {
                aiResponse = await callAnthropic(aiApiKey, aiModel, systemPrompt, messages);
            } else if (aiProvider === 'gemini') {
                aiResponse = await callGemini(aiApiKey, aiModel, messages);
            } else {
                console.error(`Unknown AI provider: ${aiProvider}`);
                return;
            }
        } catch (error) {
            console.error(`💥 AI (${aiProvider}) error:`, error);
            return;
        }

        // Parse AI response for metadata
        const dataMatch = aiResponse.match(/\[DATA:([\s\S]*?)\]/);
        let extractedData: any = {};
        if (dataMatch) {
            try {
                const parsed = JSON.parse(dataMatch[1]);
                // Validate: only accept string values that are not obviously invalid
                const invalidValues = ['confirmado', 'sim', 'não', 'nao', 'ok', 'não informado', 'nao informado', ''];
                for (const [key, value] of Object.entries(parsed)) {
                    const strVal = String(value).trim().toLowerCase();
                    if (strVal && !invalidValues.includes(strVal)) {
                        extractedData[key] = String(value).trim();
                    }
                }
            } catch (e) {
                console.error("Failed to parse AI data JSON", e);
            }
        }

        // Server-side validation before advancing stage
        let shouldAdvance = aiResponse.includes('[AVANÇAR_ETAPA]');
        if (shouldAdvance && currentStage) {
            const requiredVars = (currentStage.stage_variables || []).filter((v: any) => v.is_required);
            const mergedVars = { ...(lead.collected_variables || {}), ...extractedData };
            const missingRequired = requiredVars.filter((v: any) => !mergedVars[v.field_name]);
            if (missingRequired.length > 0) {
                console.log(`⚠️ Blocking stage advance — missing required fields: ${missingRequired.map((v: any) => v.field_name).join(', ')}`);
                shouldAdvance = false;
            }
        }

        const cleanResponse = aiResponse
            .replace(/\[AVANÇAR_ETAPA\]/g, '')
            .replace(/\[DATA:[\s\S]*?\]/g, '')
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

        if (extractedData.nome || extractedData.name) updateData.name = extractedData.nome || extractedData.name;
        if (extractedData.email) updateData.email = extractedData.email;
        if (extractedData.phone || extractedData.telefone) updateData.phone = extractedData.phone || extractedData.telefone;

        if (shouldAdvance && currentStage) {
            const stages = [...(agent.stages || [])].sort((a: any, b: any) => a.stage_order - b.stage_order);
            const nextStage = stages.find((s: any) => s.stage_order > currentStage.stage_order);

            if (nextStage) {
                updateData.current_stage_id = nextStage.id;

                // Auto-send opening message of the next stage if configured
                const openingExample = nextStage.stage_examples?.find((ex: any) => ex.role === 'opening');
                if (openingExample?.message) {
                    // Small delay so the current AI response arrives first
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const cleanOpening = openingExample.message
                        .replace(/\[AVANÇAR_ETAPA\]/g, '')
                        .replace(/\[DATA:[\s\S]*?\]/g, '')
                        .trim();
                    await sendThroughEvolution({
                        supabase,
                        instanceName,
                        phone: realPhoneNumber,
                        message: cleanOpening,
                        leadId: lead.id
                    });
                    console.log(`📬 Sent opening message for stage: ${nextStage.name}`);
                }

                if (nextStage.funnel_status) {
                    updateData.status = nextStage.funnel_status;
                    console.log(`🤖 Advancing lead ${lead.id} to stage: ${nextStage.name} (Status: ${nextStage.funnel_status})`);

                    const conversionStatuses = ['won', 'qualified', 'demo', 'converted'];
                    if (conversionStatuses.includes(nextStage.funnel_status) && lead.campaigns) {
                        const campaign = lead.campaigns;
                        if (campaign.pixel_id && campaign.facebook_access_token) {
                            try {
                                await supabase.functions.invoke('facebook-conversions', {
                                    body: {
                                        pixelId: campaign.pixel_id,
                                        accessToken: campaign.facebook_access_token,
                                        eventName: 'Lead',
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

                // Move lead to linked pipeline stage (Option B)
                if (nextStage.pipeline_stage_id) {
                    updateData.pipeline_stage_id = nextStage.pipeline_stage_id;
                    const { data: ps } = await supabase
                        .from('pipeline_stages')
                        .select('pipeline_id')
                        .eq('id', nextStage.pipeline_stage_id)
                        .single();
                    if (ps?.pipeline_id) updateData.pipeline_id = ps.pipeline_id;
                    console.log(`📋 Moving lead ${lead.id} to pipeline stage: ${nextStage.pipeline_stage_id}`);
                }
            }
        } else if (!lead.current_stage_id && currentStage) {
            updateData.current_stage_id = currentStage.id;
            if (currentStage.funnel_status) updateData.status = currentStage.funnel_status;

            // Set initial pipeline stage
            if (currentStage.pipeline_stage_id) {
                updateData.pipeline_stage_id = currentStage.pipeline_stage_id;
                const { data: ps } = await supabase
                    .from('pipeline_stages')
                    .select('pipeline_id')
                    .eq('id', currentStage.pipeline_stage_id)
                    .single();
                if (ps?.pipeline_id) updateData.pipeline_id = ps.pipeline_id;
            }
        }

        await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFormatHint(fieldType: string | null): string {
    switch (fieldType) {
        case 'email': return 'e-mail válido (ex: nome@empresa.com)';
        case 'phone': return 'telefone com DDD (ex: 11 99999-9999)';
        case 'number': return 'apenas números';
        case 'date': return 'data (ex: 15/03/2025)';
        case 'cpf': return 'CPF (ex: 123.456.789-00)';
        case 'cnpj': return 'CNPJ (ex: 12.345.678/0001-99)';
        default: return '';
    }
}

// ── AI Provider implementations ──────────────────────────────────────────────

async function callOpenAI(apiKey: string, model: string, messages: any[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages })
    });
    if (!response.ok) throw new Error(`OpenAI error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, messages: any[]): Promise<string> {
    // Anthropic uses separate system param and messages without system role
    const anthropicMessages = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: anthropicMessages
        })
    });
    if (!response.ok) throw new Error(`Anthropic error: ${response.statusText}`);
    const data = await response.json();
    return data.content[0].text;
}

async function callGemini(apiKey: string, model: string, messages: any[]): Promise<string> {
    const systemMsg = messages.find((m: any) => m.role === 'system');

    // Convert messages to Gemini format (exclude system role)
    const contents = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    const body: any = { contents };

    // Use systemInstruction (correct Gemini API field) instead of injecting as user turn
    if (systemMsg) {
        body.systemInstruction = {
            parts: [{ text: systemMsg.content }]
        };
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }
    );
    if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// ── Send via Evolution ────────────────────────────────────────────────────────

async function sendThroughEvolution(params: {
    supabase: any;
    instanceName: string;
    phone: string;
    message: string;
    leadId: string;
}) {
    const { supabase, instanceName, phone, message, leadId } = params;

    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('instance_name', instanceName)
        .single();

    if (!instance) return;

    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const evolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL') || instance.base_url || "https://evoapi.workidigital.tech";

    const headers = {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey || ''
    };

    try {
        // Simulate typing: send "composing" presence
        await fetch(`${evolutionBaseUrl}/chat/updatePresence/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ number: phone, options: { presence: 'composing' } })
        }).catch(() => {}); // ignore errors, presence is optional

        // Delay proportional to message length (min 2s, max 8s)
        const typingMs = Math.min(8000, Math.max(2000, message.length * 50));
        await new Promise(resolve => setTimeout(resolve, typingMs));

        // Stop typing presence
        await fetch(`${evolutionBaseUrl}/chat/updatePresence/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ number: phone, options: { presence: 'paused' } })
        }).catch(() => {});

        const response = await fetch(`${evolutionBaseUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                number: phone,
                text: message
            })
        });

        if (response.ok) {
            const evolutionData = await response.json();

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
