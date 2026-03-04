
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getMessageContent, getContactName } from "./helpers.ts";
import { createPhoneSearchVariations } from "./phoneVariations.ts";
import { processComercialMessage, processClientMessage, handleDirectLead } from "./handlers.ts";
import {
  corsHeaders,
  checkRateLimit,
  sanitizePhoneNumber,
  sanitizeMessageContent,
  sanitizeInstanceName,
  logSecurityEvent,
  validateWebhookPayload
} from "./security.ts";
import { handleAgentLogic } from "./aiAgentHandler.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting based on IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      logSecurityEvent('Rate limit exceeded', { ip: clientIP }, 'medium');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Use environment variables for Supabase connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!; // Use the project's own URL from env
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    // Validate webhook payload
    if (!validateWebhookPayload(body)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Evolution webhook received:', JSON.stringify(body, null, 2));

    if (body.event === 'messages.upsert' && body.data) {
      const message = body.data;
      const remoteJid = message.key?.remoteJid;
      let instanceName: string;
      const isFromMe = message.key?.fromMe;

      try {
        instanceName = sanitizeInstanceName(body.instance);
      } catch (error) {
        logSecurityEvent('Invalid instance name in webhook', {
          instance: body.instance,
          error: (error as Error)?.message || 'Unknown error'
        }, 'high');
        return new Response(
          JSON.stringify({ error: 'Invalid instance name' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (remoteJid) {
        // 🚫 FILTRAR MENSAGENS DE GRUPO (terminam com @g.us)
        if (remoteJid.endsWith('@g.us')) {
          console.log(`🚫 Ignorando mensagem de grupo: ${remoteJid}`);
          return new Response(JSON.stringify({ success: true, message: 'Group message ignored' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        let realPhoneNumber: string;
        let messageData: any;

        try {
          realPhoneNumber = sanitizePhoneNumber(remoteJid.replace('@s.whatsapp.net', ''));
          messageData = getMessageContent(message);
          // Sanitização apenas do texto para manter compatibilidade onde necessário
          messageData.text = sanitizeMessageContent(messageData.text);
        } catch (error) {
          logSecurityEvent('Invalid phone number or message content', {
            remoteJid,
            error: (error as Error)?.message || 'Unknown error'
          }, 'medium');
          return new Response(
            JSON.stringify({ error: 'Invalid phone number or message format' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        console.log(`📱 Processando mensagem de: ${realPhoneNumber} (instância: ${instanceName})`);

        // Create phone variations and look for matching leads
        const phoneVariations = createPhoneSearchVariations(realPhoneNumber);

        const { data: matchedLeads, error: searchError } = await supabase
          .from('leads')
          .select('*, campaigns!leads_campaign_id_fkey(conversion_keywords, cancellation_keywords)')
          .in('phone', phoneVariations);

        if (searchError) {
          console.error(`❌ Erro ao buscar leads por telefone:`, searchError);
        }

        let leadsToProcess = matchedLeads || [];

        if (matchedLeads && matchedLeads.length > 0) {
          console.log(`✅ ${matchedLeads.length} lead(s) encontrado(s) para ${realPhoneNumber}`);
          if (isFromMe) {
            await processComercialMessage({
              supabase, message, realPhoneNumber, matchedLeads, messageContent: messageData.text, messageData, instanceName
            });
          } else {
            await processClientMessage({
              supabase, message, realPhoneNumber, matchedLeads, messageContent: messageData.text, messageData, instanceName
            });
          }
        } else {
          // No lead found; direct WhatsApp message
          if (!isFromMe) {
            console.log(`🆕 Novo contato direto de: ${realPhoneNumber} (instância: ${instanceName})`);
            const newLead = await handleDirectLead({
              supabase,
              message,
              realPhoneNumber,
              instanceName,
              messageData
            });
            if (newLead) leadsToProcess = [newLead];
          } else {
            console.warn(`📤 Mensagem de saída ignorada: Nenhum lead encontrado para ${realPhoneNumber}. Variações tentadas: ${phoneVariations.join(', ')}`);

            // TENTATIVA EXTRA: Buscar lead que contenha o número limpo em qualquer lugar do campo 'phone'
            // Isso ajuda se o lead tiver sido salvo como "(55) 85 9837-2658" por exemplo.
            const cleanNumeric = realPhoneNumber.replace(/\D/g, '').slice(-8); // últimos 8 dígitos
            const { data: fuzzyLeads } = await supabase
              .from('leads')
              .select('*, campaigns!leads_campaign_id_fkey(conversion_keywords, cancellation_keywords)')
              .ilike('phone', `%${cleanNumeric}%`)
              .limit(1);

            if (fuzzyLeads && fuzzyLeads.length > 0) {
              console.log(`🎯 Lead encontrado via busca flexível (contendo ${cleanNumeric}): ${fuzzyLeads[0].id}`);
              await processComercialMessage({
                supabase, message, realPhoneNumber, matchedLeads: fuzzyLeads, messageContent: messageData.text, messageData, instanceName
              });
              leadsToProcess = fuzzyLeads;
            }
          }
        }

        // 🤖 INTEGRAR LÓGICA DE AGENTE IA
        if (!isFromMe && leadsToProcess.length > 0) {
          for (const lead of leadsToProcess) {
            await handleAgentLogic({
              supabase,
              lead,
              messageContent: messageData.text,
              instanceName,
              realPhoneNumber
            });
          }
        }
      }
    } else if (body.event === 'messages.update' && body.data) {
      // ✅ Tratar atualização de status da mensagem (checks)
      const update = body.data;
      if (update && update.key?.id) {
        const whatsappId = update.key.id;
        const status = update.status; // 3=enviado, 4=entregue, 5=lido

        let statusLabel = 'sent';
        if (status === 4 || status === 'DELIVERY_ACK') statusLabel = 'delivered';
        if (status === 5 || status === 'READ') statusLabel = 'read';

        console.log(`🔄 Atualizando status da mensagem ${whatsappId} para: ${statusLabel} (${status})`);

        await supabase
          .from('lead_messages')
          .update({ status: statusLabel })
          .eq('whatsapp_message_id', whatsappId);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('💥 Webhook error:', error);
    logSecurityEvent('Webhook processing error', {
      error: (error as Error)?.message || 'Unknown error',
      stack: (error as Error)?.stack
    }, 'high');

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
