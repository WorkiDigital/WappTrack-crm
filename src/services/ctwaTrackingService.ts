
import { supabase } from "@/integrations/supabase/client";
import { collectUrlParameters } from "@/lib/dataCollection";

interface CTWATrackingData {
  ctwa_clid: string;
  campaign_id: string;
  ip_address?: string;
  device_info?: any;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  source_url?: string;
  source_id?: string;
  user_agent?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
}

export const saveCTWATrackingData = async (data: CTWATrackingData): Promise<{ success: boolean; id?: string }> => {
  try {
    console.log('💾 [CTWA TRACKING] Salvando dados de rastreamento CTWA:', data);

    const { data: result, error } = await supabase
      .from('ctwa_tracking')
      .insert({
        ctwa_clid: data.ctwa_clid,
        campaign_id: data.campaign_id,
        ip_address: data.ip_address,
        device_info: data.device_info,
        utm_campaign: data.utm_campaign,
        utm_medium: data.utm_medium,
        utm_content: data.utm_content,
        utm_term: data.utm_term,
        source_url: data.source_url,
        source_id: data.source_id,
        user_agent: data.user_agent,
        screen_resolution: data.screen_resolution,
        timezone: data.timezone,
        language: data.language,
        clicked_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [CTWA TRACKING] Erro ao salvar dados:', error);
      return { success: false };
    }

    console.log('✅ [CTWA TRACKING] Dados salvos com sucesso:', result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error('❌ [CTWA TRACKING] Erro geral:', error);
    return { success: false };
  }
};

export const getCTWATrackingByClid = async (ctwa_clid: string) => {
  try {
    console.log('🔍 [CTWA TRACKING] Buscando dados por CTWA CLID:', ctwa_clid);

    const { data, error } = await supabase
      .from('ctwa_tracking')
      .select('*')
      .eq('ctwa_clid', ctwa_clid)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ [CTWA TRACKING] Erro ao buscar dados:', error);
      return null;
    }

    if (data) {
      console.log('✅ [CTWA TRACKING] Dados encontrados:', {
        id: data.id,
        ctwa_clid: data.ctwa_clid,
        campaign_id: data.campaign_id,
        clicked_at: data.clicked_at
      });
    } else {
      console.log('❌ [CTWA TRACKING] Nenhum dado encontrado para CTWA CLID:', ctwa_clid);
    }

    return data;
  } catch (error) {
    console.error('❌ [CTWA TRACKING] Erro geral ao buscar:', error);
    return null;
  }
};

export const collectAndSaveCTWAData = async (campaignId: string): Promise<{ success: boolean; ctwa_clid?: string }> => {
  try {
    console.log('🔄 [CTWA TRACKING] Coletando e salvando dados CTWA para campanha:', campaignId);

    // Coletar parâmetros da URL
    const urlParams = collectUrlParameters();
    
    // Verificar se há CTWA CLID
    if (!urlParams.ctwa_clid) {
      console.log('⚠️ [CTWA TRACKING] Nenhum CTWA CLID encontrado na URL');
      return { success: false };
    }

    // Coletar dados do dispositivo
    const deviceInfo = {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookie_enabled: navigator.cookieEnabled
    };

    // Tentar obter IP (será obtido no backend)
    let ipAddress = '';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (ipError) {
      console.warn('⚠️ [CTWA TRACKING] Não foi possível obter IP:', ipError);
    }

    const trackingData: CTWATrackingData = {
      ctwa_clid: urlParams.ctwa_clid,
      campaign_id: campaignId,
      ip_address: ipAddress,
      device_info: deviceInfo,
      utm_campaign: urlParams.utm_campaign,
      utm_medium: urlParams.utm_medium,
      utm_content: urlParams.utm_content,
      utm_term: urlParams.utm_term,
      source_url: urlParams.source_url,
      source_id: urlParams.source_id,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    const result = await saveCTWATrackingData(trackingData);
    
    if (result.success) {
      console.log('✅ [CTWA TRACKING] Dados CTWA coletados e salvos com sucesso');
      return { success: true, ctwa_clid: urlParams.ctwa_clid };
    } else {
      console.error('❌ [CTWA TRACKING] Falha ao salvar dados CTWA');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ [CTWA TRACKING] Erro geral ao coletar dados:', error);
    return { success: false };
  }
};
