
// CTWA Correlation Handler - código direto no edge function para evitar importações
export const handleCTWACorrelation = async (
  supabase: any, 
  phone: string, 
  messageText: string, 
  messageId: string, 
  status: string, 
  contactName?: string,
  messageTimestamp?: string
) => {
  console.log('🎯 [CTWA CORRELATION] ===== INICIANDO CORRELAÇÃO CTWA =====');
  console.log('🎯 [CTWA CORRELATION] Parâmetros recebidos:', {
    phone,
    messageText: messageText?.substring(0, 100),
    messageId,
    status,
    contactName,
    messageTimestamp
  });

  try {
    const messageTime = messageTimestamp ? new Date(messageTimestamp) : new Date();
    const correlationWindow = 10 * 60 * 1000; // 10 minutos para CTWA
    const windowStart = new Date(messageTime.getTime() - correlationWindow);
    
    console.log('🕒 [CTWA CORRELATION] Janela de correlação CTWA:', {
      messageTime: messageTime.toISOString(),
      windowStart: windowStart.toISOString(),
      correlationWindowMs: correlationWindow
    });

    // 🎯 MÉTODO 1: BUSCAR CTWA_CLID NA MENSAGEM
    let ctwaClid = null;
    
    // Tentar extrair CTWA CLID da mensagem ou contexto
    // Aqui você pode implementar lógica específica para extrair o CTWA CLID
    // Por exemplo, se vier no payload do webhook da Evolution
    
    console.log('🔍 [CTWA CORRELATION] Buscando CTWA CLID na mensagem...');
    
    // Se não encontrar na mensagem, buscar por pending_leads recentes
    if (!ctwaClid) {
      console.log('🔍 [CTWA CORRELATION] Buscando pending_leads com CTWA CLID...');
      
      const { data: pendingLeads, error: pendingError } = await supabase
        .from('pending_leads')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', windowStart.toISOString())
        .not('webhook_data->ctwa_clid', 'is', null)
        .order('created_at', { ascending: false });

      if (!pendingError && pendingLeads && pendingLeads.length > 0) {
        console.log('📋 [CTWA CORRELATION] Pending leads com CTWA encontrados:', {
          count: pendingLeads.length,
          leads: pendingLeads.map((lead: any) => ({
            id: lead.id,
            ctwa_clid: lead.webhook_data?.ctwa_clid,
            created_at: lead.created_at
          }))
        });

        // Usar o primeiro (mais recente) pending lead com CTWA CLID
        const latestPendingLead = pendingLeads[0];
        ctwaClid = latestPendingLead.webhook_data?.ctwa_clid;
        
        if (ctwaClid) {
          console.log('✅ [CTWA CORRELATION] CTWA CLID encontrado:', ctwaClid);
          
          // Buscar dados de tracking CTWA
          const ctwaTrackingData = await getCTWATrackingByClid(supabase, ctwaClid);
          
          if (ctwaTrackingData) {
            console.log('✅ [CTWA CORRELATION] Dados de tracking CTWA encontrados:', {
              id: ctwaTrackingData.id,
              campaign_id: ctwaTrackingData.campaign_id,
              clicked_at: ctwaTrackingData.clicked_at,
              source_url: ctwaTrackingData.source_url
            });

            // Converter pending lead para lead final
            const leadConversionResult = await convertCTWAPendingLead(
              supabase,
              latestPendingLead,
              ctwaTrackingData,
              phone,
              messageText,
              messageId,
              status,
              contactName
            );

            if (leadConversionResult) {
              console.log('🎉 [CTWA CORRELATION] Correlação CTWA bem-sucedida!');
              return true;
            }
          }
        }
      }
    }

    console.log('❌ [CTWA CORRELATION] Nenhuma correlação CTWA encontrada');
    return false;

  } catch (error) {
    console.error('❌ [CTWA CORRELATION] Erro na correlação CTWA:', error);
    return false;
  }
};

const convertCTWAPendingLead = async (
  supabase: any,
  pendingLead: any,
  ctwaTrackingData: any,
  phone: string,
  messageText: string,
  messageId: string,
  status: string,
  contactName?: string
) => {
  try {
    console.log('🔄 [CTWA CORRELATION] Convertendo pending lead CTWA...');

    // Buscar user_id da campanha
    let campaignUserId = null;
    if (ctwaTrackingData.campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('user_id, name')
        .eq('id', ctwaTrackingData.campaign_id)
        .single();

      if (campaign) {
        campaignUserId = campaign.user_id;
      }
    }

    // Criar lead com dados completos CTWA
    const leadData = {
      name: (pendingLead.name && pendingLead.name !== 'Visitante') 
        ? pendingLead.name 
        : (contactName || 'Lead via CTWA'),
      phone: phone,
      campaign: pendingLead.campaign_name || 'CTWA Campaign',
      campaign_id: ctwaTrackingData.campaign_id,
      user_id: campaignUserId,
      status: 'lead', // Status "lead" quando criar via CTWA
      last_message: messageText,
      initial_message: `Primeira mensagem CTWA: ${messageText}`,
      first_contact_date: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
      evolution_message_id: messageId,
      evolution_status: status,
      notes: `Lead criado via correlação CTWA (CLID: ${ctwaTrackingData.ctwa_clid})`,
      
      // UTM data from pending lead
      utm_source: pendingLead.utm_source,
      utm_medium: pendingLead.utm_medium,
      utm_campaign: pendingLead.utm_campaign,
      utm_content: pendingLead.utm_content,
      utm_term: pendingLead.utm_term,
      
      // Device data from CTWA tracking
      ip_address: ctwaTrackingData.ip_address,
      user_agent: ctwaTrackingData.user_agent,
      screen_resolution: ctwaTrackingData.screen_resolution,
      timezone: ctwaTrackingData.timezone,
      language: ctwaTrackingData.language,
      
      // CTWA specific data
      tracking_method: 'ctwa_correlation',
      
      // Custom fields with CTWA data
      custom_fields: {
        ctwa_clid: ctwaTrackingData.ctwa_clid,
        source_url: ctwaTrackingData.source_url,
        source_id: ctwaTrackingData.source_id,
        device_info: ctwaTrackingData.device_info,
        correlation_method: 'ctwa_enhanced',
        correlation_timestamp: new Date().toISOString(),
        pending_lead_id: pendingLead.id,
        ctwa_tracking_id: ctwaTrackingData.id
      }
    };

    console.log('💾 [CTWA CORRELATION] Dados do lead que serão inseridos:', {
      name: leadData.name,
      phone: leadData.phone,
      campaign_id: leadData.campaign_id,
      user_id: leadData.user_id,
      ctwa_clid: ctwaTrackingData.ctwa_clid,
      source_url: ctwaTrackingData.source_url
    });

    const { data: insertedLead, error: insertError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [CTWA CORRELATION] Erro ao criar lead CTWA:', insertError);
      return false;
    }

    console.log('✅ [CTWA CORRELATION] Lead CTWA criado com sucesso:', {
      id: insertedLead.id,
      name: insertedLead.name,
      phone: insertedLead.phone,
      ctwa_clid: ctwaTrackingData.ctwa_clid
    });

    // Marcar pending_lead como convertido
    await supabase
      .from('pending_leads')
      .update({ 
        status: 'converted_ctwa',
        phone: phone,
        webhook_data: {
          ...pendingLead.webhook_data,
          ctwa_conversion_timestamp: new Date().toISOString(),
          final_lead_id: insertedLead.id
        }
      })
      .eq('id', pendingLead.id);

    console.log('✅ [CTWA CORRELATION] Pending lead marcado como convertido via CTWA');
    return true;

  } catch (error) {
    console.error('❌ [CTWA CORRELATION] Erro ao converter pending lead CTWA:', error);
    return false;
  }
};

const getCTWATrackingByClid = async (supabase: any, ctwa_clid: string) => {
  try {
    const { data, error } = await supabase
      .from('ctwa_tracking')
      .select('*')
      .eq('ctwa_clid', ctwa_clid)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ [CTWA CORRELATION] Erro ao buscar tracking CTWA:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ [CTWA CORRELATION] Erro geral ao buscar tracking CTWA:', error);
    return null;
  }
};
