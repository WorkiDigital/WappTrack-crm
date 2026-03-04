import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the JWT token using getUser with token
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await authSupabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('✅ Authenticated user:', userId);

    const {
      instanceName,
      phone,
      message,
      leadId,
      mediaType,
      mediaBase64,
      mimeType,
      fileName,
      caption
    } = await req.json();

    console.log('📤 Enviando mensagem:', {
      instanceName,
      phone,
      hasMessage: !!message,
      mediaType,
      leadId
    });

    if (!instanceName || !phone || !leadId) {
      throw new Error('Parâmetros obrigatórios: instanceName, phone, leadId');
    }

    if (!message && !mediaBase64) {
      throw new Error('Mensagem ou mídia é obrigatória');
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user owns the lead before sending message
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, user_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Lead not found:', leadError);
      return new Response(
        JSON.stringify({ success: false, error: 'Lead not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (lead.user_id !== userId) {
      console.error('Unauthorized: User does not own this lead');
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - You do not own this lead' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar instância ativa pertencente ao usuário autenticado
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('user_id', userId)
      .eq('status', 'connected')
      .single();

    if (instanceError || !instance) {
      console.error('❌ Instância não encontrada ou desconectada:', instanceError);
      throw new Error('Instância WhatsApp não disponível');
    }

    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!evolutionApiKey) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }

    const envEvolutionBaseUrl = Deno.env.get('EVOLUTION_API_URL');
    const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

    const defaultEvoUrl = "https://evoapi.workidigital.tech";
    let evolutionBaseUrl = normalizeBaseUrl(envEvolutionBaseUrl || instance.base_url || defaultEvoUrl);

    // Corrigir registros antigos que ainda apontam para o domínio descontinuado
    if (evolutionBaseUrl.includes('evolutionapi.workidigital.tech')) {
      console.log('🔧 base_url antiga detectada no banco, usando EVOLUTION_API_URL ou fallback');
      evolutionBaseUrl = normalizeBaseUrl(envEvolutionBaseUrl || defaultEvoUrl);
    }

    if (!evolutionBaseUrl) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }

    let evolutionData: any;
    let messageText = message;

    // Enviar mensagem via Evolution API
    if (mediaBase64) {
      // Enviar mídia
      let endpoint = '';
      let body: any = {
        number: phone,
      };

      if (mediaType === 'image') {
        endpoint = 'sendMedia';
        body = {
          number: phone,
          mediatype: 'image',
          mimetype: mimeType || 'image/jpeg',
          caption: caption || '',
          media: mediaBase64,
          fileName: fileName || 'image.jpg',
        };
        messageText = caption || '[Imagem]';
      } else if (mediaType === 'video') {
        endpoint = 'sendMedia';
        body = {
          number: phone,
          mediatype: 'video',
          mimetype: mimeType || 'video/mp4',
          caption: caption || '',
          media: mediaBase64,
          fileName: fileName || 'video.mp4',
        };
        messageText = caption || '[Vídeo]';
      } else if (mediaType === 'audio') {
        endpoint = 'sendMedia';
        body = {
          number: phone,
          mediatype: 'audio',
          mimetype: mimeType || 'audio/ogg; codecs=opus',
          media: mediaBase64,
          fileName: fileName || 'audio.ogg',
        };
        messageText = '[Áudio]';
      }

      const evolutionUrl = `${evolutionBaseUrl}/message/${endpoint}/${instanceName}`;
      console.log('🌐 Chamando Evolution API (mídia):', evolutionUrl, { mediaType });

      const evolutionResponse = await fetch(evolutionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify(body),
      });

      if (!evolutionResponse.ok) {
        const errorText = await evolutionResponse.text();
        console.error('❌ Erro na Evolution API:', errorText);
        throw new Error(`Evolution API error: ${evolutionResponse.status}`);
      }

      evolutionData = await evolutionResponse.json();
      console.log('✅ Resposta Evolution API (mídia):', evolutionData);
    } else {
      // Enviar texto
      const evolutionUrl = `${evolutionBaseUrl}/message/sendText/${instanceName}`;
      console.log('🌐 Chamando Evolution API (texto):', evolutionUrl);

      const evolutionResponse = await fetch(evolutionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: message,
        }),
      });

      if (!evolutionResponse.ok) {
        const errorText = await evolutionResponse.text();
        console.error('❌ Erro na Evolution API:', errorText);
        throw new Error(`Evolution API error: ${evolutionResponse.status}`);
      }

      evolutionData = await evolutionResponse.json();
      console.log('✅ Resposta Evolution API (texto):', evolutionData);
    }

    // Salvar mensagem no banco de dados (incluindo metadados de mídia com fallback defensivo)
    const outMessagePayload = {
      lead_id: leadId,
      message_text: messageText,
      is_from_me: true,
      status: 'sent',
      whatsapp_message_id: evolutionData.key?.id || null,
      instance_name: instanceName,
      media_url: mediaBase64 ? 'BASE64_SENT' : null,
      media_type: mediaType,
      mime_type: mimeType,
      file_name: fileName,
    };

    let { data: savedMessage, error: saveError } = await supabase
      .from('lead_messages')
      .insert(outMessagePayload)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Erro ao salvar mensagem:', saveError);

      // Fallback defensivo
      if (saveError.code === '42703') {
        console.warn('⚠️ Colunas de mídia não encontradas. Salvando apenas texto da mensagem enviada...');
        const fallbackResult = await supabase
          .from('lead_messages')
          .insert({
            lead_id: leadId,
            message_text: messageText,
            is_from_me: true,
            status: 'sent',
            whatsapp_message_id: evolutionData.key?.id || null,
            instance_name: instanceName,
          })
          .select()
          .single();

        savedMessage = fallbackResult.data;
        saveError = fallbackResult.error;

        if (saveError) throw saveError;
      } else {
        throw saveError;
      }
    }

    console.log('✅ Mensagem salva:', savedMessage);

    // Atualizar último contato e última mensagem no Lead
    const { error: updateLeadError } = await supabase
      .from('leads')
      .update({
        last_contact_date: new Date().toISOString(),
        last_message: messageText,
        evolution_message_id: evolutionData.key?.id || null,
        evolution_status: 'sent'
      })
      .eq('id', leadId);

    if (updateLeadError) {
      console.error('❌ Erro ao atualizar resumo do lead:', updateLeadError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: savedMessage,
        evolutionResponse: evolutionData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error)?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
