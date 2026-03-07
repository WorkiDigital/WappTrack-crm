// Refactored Direct Lead Handler - Uses modular components
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { logSecurityEvent } from './security.ts';
import { createPhoneSearchVariations } from './phoneVariations.ts';
import { resolveUtmsFromMessage, markClickConverted } from './utmResolver.ts';
import { resolveCampaign } from './campaignResolver.ts';
import { createLead, checkExistingLead } from './leadCreator.ts';

export const handleDirectLead = async ({
  supabase,
  message,
  realPhoneNumber,
  instanceName,
  messageData
}: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
  messageData?: any;
}) => {
  console.log(`🆕 [DIRECT LEAD] Processing new direct contact from: ${realPhoneNumber} (instance: ${instanceName})`);

  try {
    // Extract message content from messageData if provided
    const messageContent = messageData?.text ||
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      '';

    console.log(`📝 [DIRECT LEAD] Message content: "${messageContent.substring(0, 100)}..."`);

    // Step 1: Resolve campaign and user
    const { campaign: initialCampaign, userId: initialUserId } = await resolveCampaign(
      supabase,
      null, // No click data yet
      instanceName
    );

    // Step 2: Resolve UTMs from message (may update campaign via token)
    const { utms, clickData, invisibleToken, cleanedMessage } = await resolveUtmsFromMessage(
      supabase,
      messageContent,
      realPhoneNumber,
      initialCampaign,
      instanceName
    );

    // If we found a campaign from click data, use that instead
    let linkedCampaign = initialCampaign;
    let responsibleUserId = initialUserId;

    if (clickData?.campaign_id && clickData.campaign_id !== initialCampaign?.id) {
      const { campaign, userId } = await resolveCampaign(supabase, clickData, instanceName);
      if (campaign) {
        linkedCampaign = campaign;
        responsibleUserId = userId || responsibleUserId;
      }
    }

    if (!responsibleUserId) {
      console.error(`💥 [DIRECT LEAD] CRITICAL: Could not determine responsible user for instance: ${instanceName}`);
      console.log(`🛟 [DIRECT LEAD] Attempting to create lead without linked campaign...`);
    }

    // Step 3: Check for existing lead
    const phoneVariations = createPhoneSearchVariations(realPhoneNumber);
    const existingLead = await checkExistingLead(supabase, phoneVariations);

    if (existingLead) {
      console.log(`⚠️ [DIRECT LEAD] Lead already exists: ${existingLead.id} — saving message and returning lead`);
      if (clickData) {
        await markClickConverted(supabase, clickData, existingLead.id);
      }

      // Save the inbound message for the existing lead (so it appears in the chat)
      const { cleanMessageFromInvisibleToken } = await import('./messageProcessors.ts');
      const cleanedMsg = cleanMessageFromInvisibleToken(messageContent);

      const msgPayload = {
        lead_id: existingLead.id,
        message_text: cleanedMsg || messageContent,
        is_from_me: false,
        whatsapp_message_id: message.key?.id || null,
        instance_name: instanceName,
        status: 'received',
        media_url: messageData?.mediaUrl || null,
        media_type: messageData?.mediaType || null,
        mime_type: messageData?.mimeType || null,
        file_name: messageData?.fileName || null,
      };

      const { error: msgError } = await supabase.from('lead_messages').insert(msgPayload);

      if (msgError) {
        console.error(`❌ [DIRECT LEAD] Failed to save message for existing lead:`, msgError);
        // Fallback: save text only if media columns are missing
        if (msgError.code === '42703') {
          await supabase.from('lead_messages').insert({
            lead_id: existingLead.id,
            message_text: cleanedMsg || messageContent,
            is_from_me: false,
            whatsapp_message_id: message.key?.id || null,
            instance_name: instanceName,
            status: 'received',
          });
        }
      } else {
        console.log(`✅ [DIRECT LEAD] Message saved for existing lead ${existingLead.id}`);
      }

      // Update lead with last message and unread count
      await supabase.from('leads').update({
        last_message: cleanedMsg || messageContent,
        last_contact_date: new Date().toISOString(),
        unread_count: (existingLead.unread_count || 0) + 1,
      }).eq('id', existingLead.id);

      return existingLead;
    }

    // Step 4: Get device data
    console.log(`🔍 [DIRECT LEAD] Fetching device data for: ${realPhoneNumber}`);
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);

    if (deviceData) {
      console.log(`✅ [DIRECT LEAD] Device data found`);
    }

    // Step 5: Create the lead
    const newLead = await createLead(
      supabase,
      message,
      realPhoneNumber,
      utms,
      cleanedMessage,
      linkedCampaign,
      responsibleUserId,
      deviceData,
      instanceName
    );

    if (!newLead) {
      return;
    }

    // Step 5.1: Save the first inbound message into chat history (including mídias com fallback defensivo)
    const firstMessagePayload = {
      lead_id: newLead.id,
      message_text: cleanedMessage || messageContent,
      is_from_me: false,
      whatsapp_message_id: message.key?.id || null,
      instance_name: instanceName,
      status: 'received',
      media_url: messageData?.mediaUrl,
      media_type: messageData?.mediaType,
      mime_type: messageData?.mimeType,
      file_name: messageData?.fileName,
    };

    const { error: messageError } = await supabase
      .from('lead_messages')
      .insert(firstMessagePayload);

    if (messageError) {
      console.error('❌ [DIRECT LEAD] Failed to save first message in lead_messages:', messageError);

      // Fallback defensivo
      if (messageError.code === '42703') {
        console.warn('⚠️ [DIRECT LEAD] Colunas de mídia não encontradas. Salvando apenas texto inicial...');
        await supabase
          .from('lead_messages')
          .insert({
            lead_id: newLead.id,
            message_text: cleanedMessage || messageContent,
            is_from_me: false,
            whatsapp_message_id: message.key?.id || null,
            instance_name: instanceName,
            status: 'received',
          });
      }
    } else {
      console.log('✅ [DIRECT LEAD] First message saved in lead_messages');
    }

    // Step 5.2: Fire Contact event via CAPI
    if (linkedCampaign?.conversion_api_enabled && linkedCampaign?.pixel_id && linkedCampaign?.facebook_access_token) {
      console.log('📊 [DIRECT LEAD] Disparando evento Contact via CAPI...');
      try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

        const capiResponse = await fetch(`${SUPABASE_URL}/functions/v1/facebook-conversions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY || '',
          },
          body: JSON.stringify({
            pixelId: linkedCampaign.pixel_id,
            accessToken: linkedCampaign.facebook_access_token,
            eventName: 'Contact',
            userData: {
              phone: realPhoneNumber,
              clientIp: deviceData?.ip_address,
              userAgent: deviceData?.browser,
              fbc: clickData?.fbclid ? `fb.1.${Date.now()}.${clickData.fbclid}` : undefined
            },
            customData: {
              campaign_id: linkedCampaign.id,
              lead_id: newLead.id,
              tracking_id: utms.tracking_id,
              source_url: clickData?.source_url
            }
          })
        });

        if (capiResponse.ok) {
          const capiResult = await capiResponse.json();
          console.log('✅ [DIRECT LEAD] Evento Contact enviado via CAPI:', capiResult);
        } else {
          const errorText = await capiResponse.text();
          console.error('❌ [DIRECT LEAD] Erro ao enviar Contact via CAPI:', errorText);
        }
      } catch (error) {
        console.error('❌ [DIRECT LEAD] Exceção ao enviar Contact via CAPI:', error);
      }
    }

    // Step 6: Mark click as converted
    if (clickData) {
      await markClickConverted(supabase, clickData, newLead.id);
    }

    console.log(`✅ [DIRECT LEAD] Lead created successfully:`, {
      lead_id: newLead.id,
      name: newLead.name,
      tracking_method: newLead.tracking_method,
      has_token: !!invisibleToken
    });

    return newLead;

  } catch (error) {
    console.error(`💥 [DIRECT LEAD] Critical error in handleDirectLead:`, error);
    logSecurityEvent('Critical error in handleDirectLead', {
      error: (error as Error)?.message || 'Unknown error',
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
  }
};
