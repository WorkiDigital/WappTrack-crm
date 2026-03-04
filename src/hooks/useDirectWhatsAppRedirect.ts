
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';
import { saveTrackingData } from '@/services/sessionTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useDeviceData } from './useDeviceData';
import { collectAndSaveCTWAData } from '@/services/ctwaTrackingService';

type UTMVars = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  site_source_name?: string;
  adset_id?: string;
  campaign_id?: string;
  ad_id?: string;
  placement?: string;
  facebook_ad_id?: string;
  facebook_adset_id?: string;
  facebook_campaign_id?: string;
  // 🆕 Click-to-WhatsApp parameters
  ctwa_clid?: string;
  source_url?: string;
  source_id?: string;
  media_url?: string;
};

export const useDirectWhatsAppRedirect = (
  campaignId: string | null,
  pixelInitialized: boolean
) => {
  const { captureAndSave } = useDeviceData();

  // 🆔 Gerar ID único de rastreamento (6 caracteres alfanuméricos)
  const generateTrackingId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleDirectWhatsAppRedirect = async (
    campaignData: Campaign,
    options?: {
      phone?: string;
      name?: string;
      utms?: UTMVars;
    }
  ) => {
    try {
      console.log('🔄 [DIRECT WHATSAPP] ===== INÍCIO DO REDIRECIONAMENTO CTWA =====');
      console.log('🔄 [DIRECT WHATSAPP] Campanha:', campaignData.name, {
        campaignId,
        phone: options?.phone,
        name: options?.name,
        utms: options?.utms,
        whatsapp_number: campaignData.whatsapp_number
      });

      // Verificar se o número do WhatsApp está configurado
      if (!campaignData.whatsapp_number) {
        console.error('❌ [DIRECT WHATSAPP] ERRO CRÍTICO: Número de WhatsApp não configurado para esta campanha');
        toast.error('Número de WhatsApp não configurado para esta campanha');
        return;
      }

      // ✅ COLETA UTMs DA URL ATUAL SE NÃO FORAM FORNECIDOS
      const currentUtms = options?.utms || collectUrlParameters();
      console.log('🌐 [DIRECT WHATSAPP] UTMs coletados:', currentUtms);

      // 🆔 GERAR ID ÚNICO DE RASTREAMENTO
      const leadTrackingId = generateTrackingId();
      console.log('🆔 [DIRECT WHATSAPP] ID único gerado:', leadTrackingId);

      // 🆕 COLETAR E SALVAR DADOS CTWA SE DISPONÍVEL
      let ctwaTrackingResult = null;
      if (currentUtms.ctwa_clid) {
        console.log('🎯 [DIRECT WHATSAPP] CTWA CLID detectado, coletando dados:', currentUtms.ctwa_clid);
        ctwaTrackingResult = await collectAndSaveCTWAData(campaignId!);
        
        if (ctwaTrackingResult.success) {
          console.log('✅ [DIRECT WHATSAPP] Dados CTWA salvos com sucesso');
        } else {
          console.warn('⚠️ [DIRECT WHATSAPP] Falha ao salvar dados CTWA, continuando...');
        }
      } else {
        console.log('ℹ️ [DIRECT WHATSAPP] Nenhum CTWA CLID encontrado na URL');
      }

      // 🆕 CAPTURAR E SALVAR DADOS DO DISPOSITIVO COM ID ÚNICO
      let deviceSessionId = null;
      try {
        console.log('📱 [DIRECT WHATSAPP] Capturando dados do dispositivo...');
        const deviceData = await captureAndSave();
        deviceSessionId = `${deviceData?.device_type || 'unknown'}_${deviceData?.browser || 'unknown'}_${Date.now()}`;
        console.log('✅ [DIRECT WHATSAPP] Dados do dispositivo capturados:', {
          deviceSessionId,
          device_type: deviceData?.device_type,
          browser: deviceData?.browser,
          location: deviceData?.location
        });
      } catch (deviceError) {
        console.warn('⚠️ [DIRECT WHATSAPP] Erro ao capturar dados do dispositivo:', deviceError);
        deviceSessionId = `fallback_${Date.now()}`;
      }

      // 🆕 CRIAR PENDING_LEAD COM DADOS CTWA EXPANDIDOS + ID ÚNICO
      let pendingLeadId = null;
      try {
        console.log('📋 [DIRECT WHATSAPP] ===== CRIANDO PENDING_LEAD COM CTWA + ID ÚNICO =====');
        
        const pendingLeadData = {
          campaign_id: campaignId!,
          campaign_name: campaignData.name || 'Redirecionamento Direto CTWA',
          name: options?.name || 'Visitante',
          phone: 'PENDING_CONTACT', // Placeholder até receber mensagem no WhatsApp
          status: 'pending',
          lead_tracking_id: leadTrackingId, // 🆔 ID ÚNICO
          utm_source: currentUtms.utm_source || '',
          utm_medium: currentUtms.utm_medium || '',
          utm_campaign: currentUtms.utm_campaign || '',
          utm_content: currentUtms.utm_content || '',
          utm_term: currentUtms.utm_term || '',
          webhook_data: {
            // 🎯 DADOS EXPANDIDOS PARA CORRELAÇÃO CTWA
            site_source_name: currentUtms.site_source_name,
            adset_name: currentUtms.adset_id,
            campaign_name: currentUtms.campaign_id,
            ad_name: currentUtms.ad_id,
            placement: currentUtms.placement,
            gclid: currentUtms.gclid,
            fbclid: currentUtms.fbclid,
            facebook_ad_id: currentUtms.facebook_ad_id,
            facebook_adset_id: currentUtms.facebook_adset_id,
            facebook_campaign_id: currentUtms.facebook_campaign_id,
            // 🆕 PARÂMETROS CLICK-TO-WHATSAPP
            ctwa_clid: currentUtms.ctwa_clid,
            source_url: currentUtms.source_url,
            source_id: currentUtms.source_id,
            media_url: currentUtms.media_url,
            // 🆕 IDENTIFICADORES DE SESSÃO PARA CORRELAÇÃO
            device_session_id: deviceSessionId,
            redirect_timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            // 🆕 DADOS TÉCNICOS PARA MATCHING CTWA
            correlation_window: 300000, // 5 minutos em ms
            redirect_type: 'direct_whatsapp_ctwa',
            campaign_click_id: `click_${campaignId}_${Date.now()}`,
            ctwa_tracking_id: ctwaTrackingResult?.success ? 'saved' : 'failed',
            // 🆔 ID ÚNICO PARA MATCHING 100%
            lead_tracking_id: leadTrackingId
          }
        };

        console.log('💾 [DIRECT WHATSAPP] Dados do pending_lead CTWA que serão inseridos:', {
          campaign_id: pendingLeadData.campaign_id,
          campaign_name: pendingLeadData.campaign_name,
          lead_tracking_id: leadTrackingId,
          ctwa_clid: currentUtms.ctwa_clid,
          source_url: currentUtms.source_url,
          device_session_id: deviceSessionId,
          redirect_timestamp: pendingLeadData.webhook_data.redirect_timestamp
        });

        const { data, error: pendingError } = await supabase
          .from('pending_leads')
          .insert(pendingLeadData)
          .select()
          .single();

        if (pendingError) {
          console.error('❌ [DIRECT WHATSAPP] ERRO ao criar pending_lead CTWA:', pendingError);
          throw pendingError;
        }

        pendingLeadId = data.id;
        console.log('✅ [DIRECT WHATSAPP] PENDING_LEAD CTWA CRIADO COM SUCESSO:', {
          id: data.id,
          campaign_id: data.campaign_id,
          lead_tracking_id: leadTrackingId,
          ctwa_clid: currentUtms.ctwa_clid,
          phone: data.phone,
          status: data.status,
          created_at: data.created_at
        });

      } catch (trackError) {
        console.error('❌ [DIRECT WHATSAPP] ERRO CRÍTICO ao processar pending_lead CTWA:', trackError);
        // Continuar mesmo com erro para não bloquear o redirecionamento
      }

      // 🆕 SALVAR UTM_SESSION PERSISTENTE (ATÉ 7 DIAS)
      try {
        console.log('💾 [DIRECT WHATSAPP] Salvando utm_session persistente...');
        
        const { error: utmSessionError } = await supabase
          .from('utm_sessions')
          .insert({
            campaign_id: campaignId!,
            session_id: deviceSessionId,
            utm_source: currentUtms.utm_source || campaignData.utm_source || null,
            utm_medium: currentUtms.utm_medium || campaignData.utm_medium || null,
            utm_campaign: currentUtms.utm_campaign || campaignData.utm_campaign || null,
            utm_content: currentUtms.utm_content || campaignData.utm_content || null,
            utm_term: currentUtms.utm_term || campaignData.utm_term || null,
            device_fingerprint: {
              user_agent: navigator.userAgent,
              screen_resolution: `${screen.width}x${screen.height}`,
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              device_session_id: deviceSessionId,
              lead_tracking_id: leadTrackingId // 🆔 Incluir ID único
            },
            user_agent: navigator.userAgent
          });
        
        if (utmSessionError) {
          console.error('❌ [DIRECT WHATSAPP] Erro ao salvar utm_session:', utmSessionError);
        } else {
          console.log('✅ [DIRECT WHATSAPP] UTM_SESSION persistente salva com sucesso (válida por 7 dias)');
        }
      } catch (utmSessionErr) {
        console.warn('⚠️ [DIRECT WHATSAPP] Erro ao salvar utm_session, continuando...:', utmSessionErr);
      }

      // 🆕 SALVAR DADOS DE TRACKING COM IDENTIFICADORES CTWA EXPANDIDOS
      try {
        console.log('📊 [DIRECT WHATSAPP] Salvando dados de tracking CTWA...');
        const enhancedTrackingData = {
          ...currentUtms,
          device_session_id: deviceSessionId,
          campaign_click_id: `click_${campaignId}_${Date.now()}`,
          redirect_timestamp: new Date().toISOString(),
          correlation_window: 300000, // 5 minutos
          tracking_method: 'direct_whatsapp_ctwa_enhanced',
          pending_lead_id: pendingLeadId,
          lead_tracking_id: leadTrackingId, // 🆔 ID único
          // 🆕 Dados CTWA específicos
          ctwa_correlation_ready: !!currentUtms.ctwa_clid
        };

        const trackingResult = await saveTrackingData(enhancedTrackingData, campaignId!);
        if (trackingResult.success) {
          console.log('✅ [DIRECT WHATSAPP] Dados de tracking CTWA salvos:', {
            session_id: trackingResult.session_id,
            device_session_id: deviceSessionId,
            campaign_id: campaignId,
            pending_lead_id: pendingLeadId,
            lead_tracking_id: leadTrackingId,
            ctwa_clid: currentUtms.ctwa_clid
          });
        }
      } catch (trackingError) {
        console.warn('⚠️ [DIRECT WHATSAPP] Erro ao salvar tracking CTWA, continuando...:', trackingError);
      }

      // Tracking avançado se necessário
      if (campaignData.event_type && pixelInitialized) {
        try {
          const { trackEnhancedCustomEvent } = useEnhancedPixelTracking(campaignData);
          console.log('📊 [DIRECT WHATSAPP] Executando tracking avançado CTWA:', campaignData.event_type);
          await trackEnhancedCustomEvent(campaignData.event_type, {
            redirect_type: 'direct_whatsapp_ctwa',
            campaign_name: campaignData.name,
            device_session_id: deviceSessionId,
            pending_lead_id: pendingLeadId,
            lead_tracking_id: leadTrackingId,
            ctwa_clid: currentUtms.ctwa_clid
          });
          console.log('✅ [DIRECT WHATSAPP] Tracking avançado CTWA executado com sucesso');
        } catch (trackingError) {
          console.warn('⚠️ [DIRECT WHATSAPP] Tracking avançado CTWA falhou, continuando com redirecionamento:', trackingError);
        }
      }

      // 🆔 Incluir ID único no início da mensagem para rastreamento perfeito
      const baseMessage = campaignData.custom_message || 
                         `Olá! Vim pelo ${campaignData.name}. Quero mais informações!`;
      const message = `[${leadTrackingId}] ${baseMessage}`;

      // Monta a URL do WhatsApp com mensagem personalizada
      let whatsappUrl = `https://wa.me/${campaignData.whatsapp_number}`;

      if (message) {
        const encodedMessage = encodeURIComponent(message);
        whatsappUrl += `?text=${encodedMessage}`;
      }

      console.log('↗️ [DIRECT WHATSAPP] ===== REDIRECIONANDO PARA WHATSAPP CTWA =====');
      console.log('↗️ [DIRECT WHATSAPP] URL:', whatsappUrl);
      console.log('📋 [DIRECT WHATSAPP] Resumo da sessão CTWA:', {
        campaignId,
        campaignName: campaignData.name,
        leadTrackingId,
        pendingLeadId,
        deviceSessionId,
        ctwa_clid: currentUtms.ctwa_clid,
        whatsappNumber: campaignData.whatsapp_number,
        customMessage: !!campaignData.custom_message
      });

      toast.success('Redirecionando para o WhatsApp...');
      
      // Garantir que o redirecionamento aconteça
      window.location.href = whatsappUrl;
      
      console.log('✅ [DIRECT WHATSAPP] ===== REDIRECIONAMENTO CTWA CONCLUÍDO =====');

    } catch (err) {
      console.error('❌ [DIRECT WHATSAPP] ERRO GERAL no redirecionamento direto CTWA:', err);
      toast.error('Erro ao processar redirecionamento direto');
      
      // Tentar redirecionamento mesmo com erro
      if (campaignData.whatsapp_number) {
        console.log('🛟 [DIRECT WHATSAPP] Tentando redirecionamento de emergência...');
        window.location.href = `https://wa.me/${campaignData.whatsapp_number}`;
      }
    }
  };

  return {
    handleDirectWhatsAppRedirect
  };
};
