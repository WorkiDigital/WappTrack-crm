import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { getDeliverySettings } from './messageAggregator.ts';

// ── Helpers para envio humanizado ─────────────────────────────────────────────

/**
 * Quebra texto em chunks respeitando frases completas e limite de caracteres.
 */
function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  // Divide por parágrafo primeiro
  const paragraphs = text.split(/\n+/);

  let current = '';
  for (const para of paragraphs) {
    if (!para.trim()) continue;

    if ((current + (current ? '\n' : '') + para).length <= maxChars) {
      current = current ? current + '\n' + para : para;
      continue;
    }

    // Parágrafo maior que maxChars: divide por frases
    if (current) { chunks.push(current.trim()); current = ''; }

    const sentences = para.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      if ((current + (current ? ' ' : '') + sentence).length <= maxChars) {
        current = current ? current + ' ' + sentence : sentence;
      } else {
        if (current) { chunks.push(current.trim()); current = ''; }
        // Frase ainda maior que maxChars: corta em palavras
        if (sentence.length > maxChars) {
          const words = sentence.split(' ');
          for (const word of words) {
            if ((current + (current ? ' ' : '') + word).length <= maxChars) {
              current = current ? current + ' ' + word : word;
            } else {
              if (current) { chunks.push(current.trim()); }
              current = word;
            }
          }
        } else {
          current = sentence;
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c.length > 0);
}

/**
 * Retorna delay de typing baseado no tamanho do chunk.
 */
function getChunkDelay(chunk: string, settings: any, totalChunks: number = 1): number {
  const len = chunk.length;
  let base: number;
  if (len <= 60) base = settings.short_delay_ms ?? 1100;
  else if (len <= 120) base = settings.medium_delay_ms ?? 2100;
  else base = settings.long_delay_ms ?? 3200;

  // Acréscimo por quantidade de chunks para parecer mais humano
  if (totalChunks >= 4) base += 700;
  else if (totalChunks >= 3) base += 400;

  return base;
}

/**
 * Retorna pausa aleatória entre chunks.
 */
function randomPause(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export async function handleAgentLogic(params: {
    supabase: any;
    lead: any;
    messageContent: string;
    instanceName: string;
    realPhoneNumber: string;
}) {
    const { supabase, messageContent, instanceName, realPhoneNumber } = params;

    console.log(`\n🤖 ═══════════════════════════════════════════════════════`);
    console.log(`🤖 handleAgentLogic STARTED`);
    console.log(`🤖 Lead ID: ${params.lead.id}`);
    console.log(`🤖 Message: "${messageContent}"`);
    console.log(`🤖 Instance: ${instanceName}`);
    console.log(`🤖 ═══════════════════════════════════════════════════════`);

    // 🔄 Re-fetch lead from DB to get the LATEST agent_id and current_stage_id
    // (the lead object passed in may be stale from the initial query)
    const { data: freshLead, error: freshLeadError } = await supabase
        .from('leads')
        .select('*, campaigns!leads_campaign_id_fkey(conversion_keywords, cancellation_keywords, pixel_id, facebook_access_token)')
        .eq('id', params.lead.id)
        .single();

    if (freshLeadError || !freshLead) {
        console.error(`🤖 ❌ Failed to re-fetch lead ${params.lead.id}:`, freshLeadError);
        return;
    }

    const lead = freshLead;
    console.log(`🤖 Fresh lead data - agent_id: ${lead.agent_id}, current_stage_id: ${lead.current_stage_id}`);

    // 1. Check for triggers if lead doesn't have an agent assigned
    if (!lead.agent_id) {
        console.log(`🤖 No agent_id on lead, checking triggers...`);
        // FIX: check if the MESSAGE contains the trigger phrase (not the other way around)
        const { data: triggers } = await supabase
            .from('agent_triggers')
            .select('agent_id, phrase');

        console.log(`🤖 Found ${(triggers || []).length} trigger(s) to check`);

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
                console.error("🤖 ❌ Error updating lead agent_id:", updateError);
                return;
            }

            lead.agent_id = matched.agent_id;
        } else {
            console.log(`🤖 No trigger matched for message: "${msgLower}". Agent will NOT process this message.`);
        }
    } else {
        console.log(`🤖 Lead already has agent_id: ${lead.agent_id}`);
    }

    // 2. If lead has an agent, process with AI
    if (lead.agent_id) {
        console.log(`🤖 Step 2: Fetching agent ${lead.agent_id} from DB...`);
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
            console.log(`🤖 ❌ Agent ${lead.agent_id} not found, inactive, or error:`, agentError);
            console.log(`🤖 Agent data:`, agent ? { id: agent.id, is_active: agent.is_active, name: agent.name } : 'null');
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

        console.log(`🤖 AI Config: provider=${aiProvider}, model=${aiModel}, hasKey=${!!aiApiKey}`);

        if (!aiApiKey) {
            console.warn(`⚠️ No AI API key configured for provider "${aiProvider}". Skipping AI response.`);
            return;
        }

        // Fetch conversation history (last 30 messages), EXCLUDING the current message
        // (processClientMessage already saved it to DB before this runs)
        const { data: history, error: historyError } = await supabase
            .from('lead_messages')
            .select('message_text, is_from_me, created_at')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false })
            .limit(31);

        if (historyError) {
            console.error(`🤖 ❌ Error fetching history:`, historyError);
        }

        console.log(`🤖 History: ${(history || []).length} messages found in DB`);

        // FIX: Remove only the MOST RECENT matching user message (not ALL duplicates)
        // This prevents breaking the conversation when the user sends similar messages
        const normalizedCurrent = messageContent.trim().replace(/\s+/g, ' ');
        let removedOne = false;
        const filteredHistory = (history || [])
            .filter((m: any) => {
                if (m.is_from_me) return true;
                if (!removedOne) {
                    const normalizedMsg = (m.message_text || '').trim().replace(/\s+/g, ' ');
                    if (normalizedMsg === normalizedCurrent) {
                        removedOne = true;
                        return false; // Remove only the first (most recent) match
                    }
                }
                return true;
            })
            .slice(0, 30)
            .reverse();

        console.log(`🤖 Filtered history: ${filteredHistory.length} messages (removed current: ${removedOne})`);

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

        console.log(`🤖 Total messages to AI: ${messages.length} (1 system + ${filteredHistory.length} history + 1 current)`);

        let aiResponse = '';

        try {
            console.log(`🤖 Calling ${aiProvider} API with model ${aiModel}...`);
            if (aiProvider === 'openai') {
                aiResponse = await callOpenAI(aiApiKey, aiModel, messages);
            } else if (aiProvider === 'anthropic') {
                aiResponse = await callAnthropic(aiApiKey, aiModel, systemPrompt, messages);
            } else if (aiProvider === 'gemini') {
                aiResponse = await callGemini(aiApiKey, aiModel, messages);
            } else {
                console.error(`🤖 ❌ Unknown AI provider: ${aiProvider}`);
                return;
            }
            console.log(`🤖 ✅ AI response received (${aiResponse.length} chars): "${aiResponse.substring(0, 100)}..."`);
        } catch (error) {
            console.error(`🤖 💥 AI (${aiProvider}) error:`, error);
            console.error(`🤖 💥 Error details:`, (error as Error)?.message, (error as Error)?.stack);
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
        console.log(`🤖 Sending response via Evolution to ${realPhoneNumber}: "${cleanResponse.substring(0, 80)}..."`);
        await sendThroughEvolution({
            supabase,
            instanceName,
            phone: realPhoneNumber,
            message: cleanResponse,
            leadId: lead.id
        });
        console.log(`🤖 ✅ Response sent successfully!`);

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
                                        testEventCode: null,
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

        const { error: leadUpdateError } = await supabase
            .from('leads')
            .update(updateData)
            .eq('id', lead.id);

        if (leadUpdateError) {
            console.error(`🤖 ❌ Error updating lead state:`, leadUpdateError);
        } else {
            console.log(`🤖 ✅ Lead ${lead.id} state updated:`, Object.keys(updateData));
        }

        console.log(`🤖 ═══════════════════════════════════════════════════════`);
        console.log(`🤖 handleAgentLogic COMPLETED for lead ${lead.id}`);
        console.log(`🤖 ═══════════════════════════════════════════════════════\n`);
    } else {
        console.log(`🤖 ⏭️ No agent_id on lead ${lead.id} after trigger check. Skipping AI processing.`);
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
    const evolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL') || instance.base_url || "https://painelevo.workidigital.tech";

    const headers = {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey || ''
    };

    try {
        // Carrega configurações de entrega (feature flag)
        const settings = await getDeliverySettings(supabase);

        if (!settings?.feature_enabled || !settings?.split_long_messages) {
            // ── Comportamento original intacto ────────────────────────────────
            await fetch(`${evolutionBaseUrl}/chat/updatePresence/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number: phone, options: { presence: 'composing' } })
            }).catch(() => {});

            const typingMs = Math.min(8000, Math.max(2000, message.length * 50));
            await new Promise(resolve => setTimeout(resolve, typingMs));

            await fetch(`${evolutionBaseUrl}/chat/updatePresence/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number: phone, options: { presence: 'paused' } })
            }).catch(() => {});

            const response = await fetch(`${evolutionBaseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number: phone, text: message })
            });

            if (response.ok) {
                const evolutionData = await response.json();
                await supabase.from('lead_messages').insert({
                    lead_id: leadId,
                    message_text: message,
                    is_from_me: true,
                    status: 'sent',
                    whatsapp_message_id: evolutionData.key?.id || null,
                    instance_name: instanceName
                });
                await supabase.from('leads').update({
                    last_contact_date: new Date().toISOString(),
                    last_message: message,
                    evolution_status: 'sent'
                }).eq('id', leadId);
            }
            return;
        }

        // ── Envio humanizado: chunk por chunk ─────────────────────────────────
        console.log(`🗣️ [HUMANIZED] Enviando mensagem em chunks para ${phone}`);
        const chunks = splitIntoChunks(message, settings.max_chars_per_chunk);
        console.log(`🗣️ [HUMANIZED] ${chunks.length} chunk(s) gerado(s)`);

        let lastMessageId: string | null = null;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const typingMs = getChunkDelay(chunk, settings, chunks.length);

            // 1. Simula digitação via sendPresence (inclui delay interno da Evolution API)
            if (settings.simulate_typing) {
                await fetch(`${evolutionBaseUrl}/chat/sendPresence/${instanceName}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        number: phone,
                        options: { delay: typingMs, presence: settings.presence_type || 'composing' }
                    })
                }).catch(() => {});
            }

            // 2. Aguarda o tempo de digitação
            await new Promise(resolve => setTimeout(resolve, typingMs));

            // 3. Envia o chunk
            const response = await fetch(`${evolutionBaseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ number: phone, text: chunk, delay: 0 })
            });

            // 4. Salva no banco
            if (response.ok) {
                const evolutionData = await response.json();
                lastMessageId = evolutionData.key?.id || null;
                await supabase.from('lead_messages').insert({
                    lead_id: leadId,
                    message_text: chunk,
                    is_from_me: true,
                    status: 'sent',
                    whatsapp_message_id: lastMessageId,
                    instance_name: instanceName
                });
                console.log(`🗣️ [HUMANIZED] Chunk ${i + 1}/${chunks.length} enviado: "${chunk.substring(0, 50)}..."`);
            } else {
                const errText = await response.text();
                console.error(`🗣️ [HUMANIZED] Erro ao enviar chunk ${i + 1}:`, errText);
            }

            // 5. Pausa entre chunks (exceto após o último)
            if (i < chunks.length - 1) {
                const pauseMin = chunks.length >= 4
                    ? 1000
                    : (settings.pause_between_chunks_min_ms ?? 700);
                const pauseMax = chunks.length >= 4
                    ? 2200
                    : (settings.pause_between_chunks_max_ms ?? 1700);
                const pause = randomPause(pauseMin, pauseMax);
                await new Promise(resolve => setTimeout(resolve, pause));
            }
        }

        // Atualiza lead com o último chunk enviado (mantém comportamento atual)
        const lastChunk = chunks[chunks.length - 1];
        await supabase.from('leads').update({
            last_contact_date: new Date().toISOString(),
            last_message: lastChunk,
            evolution_status: 'sent'
        }).eq('id', leadId);

        console.log(`🗣️ [HUMANIZED] Envio completo: ${chunks.length} chunk(s) para ${phone}`);

    } catch (error) {
        console.error("Error sending Evolution message:", error);
    }
}
