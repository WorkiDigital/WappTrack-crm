
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { fetchProfilePicture } from './profilePictureHandler.ts';

// Limpar caracteres invisíveis do texto (nova função)
export function cleanMessageFromInvisibleToken(message: string): string {
  // Remove todos os caracteres zero-width
  return message.replace(/[\u200B\u200C\u200D\uFEFF]+/g, '');
}

// 🔐 Decodifica token invisível de caracteres zero-width
export function decodeInvisibleToken(text: string): string | null {
  const reverseMap: Record<string, string> = {
    '\u200B': '0',
    '\u200C': '1',
    '\u200D': '2',
    '\u200B\u200B': '3',
    '\u200B\u200C': '4',
    '\u200B\u200D': '5',
    '\u200C\u200B': '6',
    '\u200C\u200C': '7',
    '\u200C\u200D': '8',
    '\u200D\u200B': '9',
    '\u200D\u200C': 'A',
    '\u200D\u200D': 'B',
    '\u200B\u200B\u200B': 'C',
    '\u200B\u200B\u200C': 'D',
    '\u200B\u200B\u200D': 'E',
    '\u200B\u200C\u200B': 'F',
    '\u200B\u200C\u200C': 'G',
    '\u200B\u200C\u200D': 'H',
    '\u200B\u200D\u200B': 'I',
    '\u200B\u200D\u200C': 'J',
    '\u200B\u200D\u200D': 'K',
    '\u200C\u200B\u200B': 'L',
    '\u200C\u200B\u200C': 'M',
    '\u200C\u200B\u200D': 'N',
    '\u200C\u200C\u200B': 'O',
    '\u200C\u200C\u200C': 'P',
    '\u200C\u200C\u200D': 'Q',
    '\u200C\u200D\u200B': 'R',
    '\u200C\u200D\u200C': 'S',
    '\u200C\u200D\u200D': 'T',
    '\u200D\u200B\u200B': 'U',
    '\u200D\u200B\u200C': 'V',
    '\u200D\u200B\u200D': 'W',
    '\u200D\u200C\u200B': 'X',
    '\u200D\u200C\u200C': 'Y',
    '\u200D\u200D\u200B': 'Z'
  };

  const zeroWidthChars = text.match(/[\u200B\u200C\u200D]+/g);
  if (!zeroWidthChars) return null;

  let decoded = '';
  let i = 0;
  const fullZeroWidth = zeroWidthChars.join('');

  while (i < fullZeroWidth.length) {
    const triple = fullZeroWidth.slice(i, i + 3);
    if (reverseMap[triple]) {
      decoded += reverseMap[triple];
      i += 3;
      continue;
    }

    const double = fullZeroWidth.slice(i, i + 2);
    if (reverseMap[double]) {
      decoded += reverseMap[double];
      i += 2;
      continue;
    }

    const single = fullZeroWidth[i];
    if (reverseMap[single]) {
      decoded += reverseMap[single];
      i += 1;
      continue;
    }

    i++;
  }

  return decoded || null;
}

// ✅ FUNÇÃO ATUALIZADA PARA PROCESSAR MENSAGENS DE CLIENTE (AGORA SALVA A MENSAGEM)
export const processClientMessage = async (params: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  matchedLeads: any[];
  messageContent: string;
  messageData?: any;
  instanceName: string;
}) => {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent, messageData, instanceName } = params;

  console.log(`📱 Processing client message from: ${realPhoneNumber}`);

  // 👻 Tentar decodificar token invisível
  const invisibleToken = decodeInvisibleToken(messageContent);
  if (invisibleToken) {
    console.log(`👻 Token invisível detectado: ${invisibleToken}`);
  }

  // Primeiro, tentar conversão de pending_lead (fluxo formulário)
  const { handlePendingLeadConversion } = await import('./pendingLeadHandler.ts');
  await handlePendingLeadConversion(
    supabase,
    realPhoneNumber,
    messageContent,
    message.key?.id || '',
    message.status || 'received',
    message.pushName,
    invisibleToken || undefined
  );

  // Atualizar leads existentes com mensagem e data de contato
  for (const lead of matchedLeads) {
    try {
      // 📸 Buscar foto do perfil do WhatsApp via handler reutilizável
      let profilePictureUrl = lead.profile_picture_url;

      if (!profilePictureUrl) {
        console.log(`📸 [CLIENT MESSAGE] Lead ${lead.id} sem foto, buscando...`);
        profilePictureUrl = await fetchProfilePicture(supabase, realPhoneNumber);
      }

      // Limpar mensagem de tokens invisíveis antes de salvar
      const cleanedMessage = cleanMessageFromInvisibleToken(messageContent);

      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: message.key?.id,
        evolution_status: message.status,
        last_message: cleanedMessage,
        profile_picture_url: profilePictureUrl,
      };

      // Se é a primeira mensagem do lead, definir como initial_message também
      if (!lead.initial_message) {
        updateData.initial_message = `Primeira mensagem: ${cleanedMessage}`;
      }

      // Lógica de automação baseada em palavras-chave (Tags)
      const checkKeywords = (text: string, keywords: string[]) => {
        return keywords.some(kw => {
          const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(text);
        });
      };

      const campaign = lead.campaigns; // Assuming campaign is available on lead
      const conversionKeywords = campaign?.conversion_keywords || ['venda comprada', 'pago', 'confirmado', 'venda realizada'];
      const cancellationKeywords = campaign?.cancellation_keywords || ['cancelar', 'remover', 'parar', 'desistir'];

      if (checkKeywords(cleanedMessage, conversionKeywords)) {
        console.log(`🎯 Palavra-chave de CONVERSÃO detectada em: "${cleanedMessage}"`);
        const { error: updateErrorKeyword } = await supabase
          .from('leads')
          .update({ status: 'converted' }) // Changed to 'converted' for consistency
          .eq('id', lead.id);

        if (updateErrorKeyword) console.error('Erro ao mover lead para conversão:', updateErrorKeyword);
        else if (campaign) {
          // 🆕 CRIAR VENDA NO BANCO DE DADOS
          const { error: saleError } = await supabase.from('sales').insert({
            amount: 0,
            sale_date: new Date().toISOString(),
            status: 'confirmed',
            notes: 'Venda detectada via webhook (mensagem de cliente)',
            lead_id: lead.id,
            campaign_id: campaign.id
          });
          if (saleError) console.error('❌ Erro ao criar venda automática:', saleError);
          else console.log('✅ Venda criada automaticamente para o lead:', lead.id);

          // 🆕 DISPARAR PURCHASE VIA CAPI
          if (campaign.conversion_api_enabled && campaign.pixel_id && campaign.facebook_access_token) {
            try {
              const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
              const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
              const capiRes = await fetch(`${SUPABASE_URL}/functions/v1/facebook-conversions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY || '' },
                body: JSON.stringify({
                  pixelId: campaign.pixel_id,
                  accessToken: campaign.facebook_access_token,
                  eventName: 'Purchase',
                  userData: { phone: realPhoneNumber },
                  customData: { value: 0, currency: 'BRL', campaign_id: campaign.id, lead_id: lead.id }
                })
              });
              if (capiRes.ok) console.log('✅ Evento Purchase enviado via CAPI');
              else console.error('❌ Erro da API ao enviar Purchase:', await capiRes.text());
            } catch (e) {
              console.error('❌ Exceção ao enviar Purchase via CAPI', e);
            }
          }
        }
      } else if (checkKeywords(cleanedMessage, cancellationKeywords)) {
        console.log(`🚫 Palavra-chave de CANCELAMENTO detectada em: "${cleanedMessage}"`);
        const { error: updateErrorKeyword } = await supabase
          .from('leads')
          .update({ status: 'cancelled' })
          .eq('id', lead.id);

        if (updateErrorKeyword) console.error('Erro ao mover lead para cancelado:', updateErrorKeyword);
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          ...updateData,
          unread_count: (lead.unread_count || 0) + 1
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`❌ Error updating lead ${lead.id}:`, updateError);
      } else {
        console.log(`✅ Updated lead ${lead.id} with message and incremented unread_count.`);
      }

      // Para áudio recebido: buscar base64 descriptografado via Evolution API
      let resolvedMediaUrl = messageData?.mediaUrl || null;
      if (messageData?.mediaType === 'audio' && message.key?.id) {
        try {
          const evoApiKey = Deno.env.get('EVOLUTION_API_KEY');
          if (evoApiKey) {
            // Buscar base_url da instância no banco (igual ao evolution-send-message)
            const { data: instanceData } = await supabase
              .from('whatsapp_instances')
              .select('base_url')
              .eq('instance_name', instanceName)
              .single();
            const rawBase = Deno.env.get('EVOLUTION_API_URL') || instanceData?.base_url || 'https://evoapi.workidigital.tech';
            const evoBaseUrl = rawBase.replace(/\/+$/, '').replace('evolutionapi.workidigital.tech', 'evoapi.workidigital.tech');

            console.log(`🎵 Buscando base64 de áudio em: ${evoBaseUrl}/chat/getBase64FromMediaMessage/${instanceName}`);

            const b64Res = await fetch(`${evoBaseUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': evoApiKey },
              body: JSON.stringify({ message: message, convertToMp4: false }),
            });

            const responseText = await b64Res.text();
            console.log(`🎵 Resposta getBase64 (${b64Res.status}):`, responseText.slice(0, 200));

            if (b64Res.ok) {
              const b64Data = JSON.parse(responseText);
              if (b64Data?.base64) {
                const mime = b64Data.mimetype || messageData?.mimeType || 'audio/ogg; codecs=opus';
                resolvedMediaUrl = `data:${mime};base64,${b64Data.base64}`;
                console.log(`✅ Áudio base64 resolvido para lead ${lead.id} (${resolvedMediaUrl.length} chars)`);
              } else {
                console.warn('⚠️ getBase64 retornou sem campo base64:', responseText.slice(0, 300));
              }
            } else {
              console.warn(`⚠️ getBase64FromMediaMessage falhou (${b64Res.status}): ${responseText.slice(0, 300)}`);
            }
          } else {
            console.warn('⚠️ EVOLUTION_API_KEY não configurada, áudio não pode ser decodificado');
          }
        } catch (audioErr) {
          console.warn('⚠️ Erro ao buscar base64 do áudio:', audioErr);
        }
      }

      // Salvar mensagem no histórico de chat (incluindo mídias com fallback defensivo)
      const messagePayload = {
        lead_id: lead.id,
        message_text: cleanedMessage,
        is_from_me: false,
        whatsapp_message_id: message.key?.id,
        instance_name: instanceName,
        media_url: resolvedMediaUrl,
        media_type: messageData?.mediaType,
        mime_type: messageData?.mimeType,
        file_name: messageData?.fileName,
      };

      const { error: messageError } = await supabase
        .from('lead_messages')
        .insert(messagePayload);

      if (messageError) {
        console.error(`❌ Error saving message for lead ${lead.id}:`, messageError);

        // Fallback defensivo: Tentar salvar apenas o texto se as novas colunas falharem
        if (messageError.code === '42703') { // undefined_column
          console.warn('⚠️ Colunas de mídia não encontradas no banco. Salvando apenas texto...');
          const { error: fallbackError } = await supabase
            .from('lead_messages')
            .insert({
              lead_id: lead.id,
              message_text: cleanedMessage,
              is_from_me: false,
              whatsapp_message_id: message.key?.id,
              instance_name: instanceName,
            });

          if (fallbackError) {
            console.error('❌ Erro fatal ao salvar mensagem mesmo com fallback:', fallbackError);
          } else {
            console.log('✅ Mensagem salva (apenas texto) após fallback.');
          }
        }
      } else {
        console.log(`✅ Message saved in chat history for lead ${lead.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error);
    }
  }
};

// ✅ FUNÇÃO ATUALIZADA PARA PROCESSAR MENSAGENS COMERCIAIS (SEM ATUALIZAR last_message)
export const processComercialMessage = async (params: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  matchedLeads: any[];
  messageContent: string;
  messageData?: any;
  instanceName: string;
}) => {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent, messageData, instanceName } = params;

  console.log(`💼 Processing commercial message to: ${realPhoneNumber}`);

  // Lógica de automação baseada em palavras-chave (Tags)
  const checkKeywords = (text: string, keywords: string[]) => {
    return keywords.some(kw => {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text);
    });
  };

  // Verificar palavras-chave de conversão e cancelamento
  for (const lead of matchedLeads) {
    const campaign = lead.campaigns;
    let newStatus = lead.status;

    const conversionKeywords = campaign?.conversion_keywords || ['venda comprada', 'pago', 'confirmado', 'venda realizada'];
    const cancellationKeywords = campaign?.cancellation_keywords || ['cancelar', 'remover', 'parar', 'desistir'];

    if (checkKeywords(messageContent, conversionKeywords)) {
      newStatus = 'converted';
      console.log(`🎉 COMERCIAL: Conversion detected for lead ${lead.id}`);

      if (campaign && lead.status !== 'converted') { // Apenas executa se não estava convertido
        // 🆕 CRIAR VENDA NO BANCO DE DADOS
        const { error: saleError } = await supabase.from('sales').insert({
          amount: 0,
          sale_date: new Date().toISOString(),
          status: 'confirmed',
          notes: 'Venda detectada via webhook (mensagem comercial)',
          lead_id: lead.id,
          campaign_id: campaign.id
        });
        if (saleError) console.error('❌ Erro ao criar venda automática:', saleError);
        else console.log('✅ Venda criada automaticamente para o lead:', lead.id);

        // 🆕 DISPARAR PURCHASE VIA CAPI
        if (campaign.conversion_api_enabled && campaign.pixel_id && campaign.facebook_access_token) {
          try {
            const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
            const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
            const capiRes = await fetch(`${SUPABASE_URL}/functions/v1/facebook-conversions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY || '' },
              body: JSON.stringify({
                pixelId: campaign.pixel_id,
                accessToken: campaign.facebook_access_token,
                eventName: 'Purchase',
                userData: { phone: realPhoneNumber },
                customData: { value: 0, currency: 'BRL', campaign_id: campaign.id, lead_id: lead.id }
              })
            });
            if (capiRes.ok) console.log('✅ Evento Purchase enviado via CAPI');
            else console.error('❌ Erro da API ao enviar Purchase:', await capiRes.text());
          } catch (e) {
            console.error('❌ Exceção ao enviar Purchase via CAPI', e);
          }
        }
      }
    } else if (checkKeywords(messageContent, cancellationKeywords)) {
      newStatus = 'lost';
      console.log(`❌ COMERCIAL: Cancellation detected for lead ${lead.id}`);
    }

    // Atualizar lead com data de contato, status e última mensagem (para visualização no painel)
    const leadUpdateData: any = {
      last_contact_date: new Date().toISOString(),
      evolution_message_id: message.key?.id,
      evolution_status: message.status,
      status: newStatus,
      last_message: messageContent, // AGORA ATUALIZA O RESUMO NA LISTA
    };

    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update(leadUpdateData)
        .eq('id', lead.id);

      if (updateError) {
        console.error(`❌ Error updating lead ${lead.id}:`, updateError);
      } else {
        console.log(`✅ Updated lead ${lead.id} with status: ${newStatus} (preserving first message)`);
      }

      // Salvar mensagem comercial no histórico de chat com fallback defensivo
      const commercialPayload = {
        lead_id: lead.id,
        message_text: messageContent,
        is_from_me: true,
        whatsapp_message_id: message.key?.id,
        instance_name: instanceName,
        media_url: messageData?.mediaUrl,
        media_type: messageData?.mediaType,
        mime_type: messageData?.mimeType,
        file_name: messageData?.fileName,
      };

      const { error: messageError } = await supabase
        .from('lead_messages')
        .insert(commercialPayload);

      if (messageError) {
        console.error(`❌ Error saving commercial message for lead ${lead.id}:`, messageError);

        // Fallback defensivo
        if (messageError.code === '42703') {
          console.warn('⚠️ Colunas de mídia não encontradas. Salvando apenas texto comercial...');
          await supabase
            .from('lead_messages')
            .insert({
              lead_id: lead.id,
              message_text: messageContent,
              is_from_me: true,
              whatsapp_message_id: message.key?.id,
              instance_name: instanceName,
            });
        }
      } else {
        console.log(`✅ Commercial message saved in chat history for lead ${lead.id}`);
      }
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error);
    }
  }
};
