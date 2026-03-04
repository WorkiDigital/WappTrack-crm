
// Handler para buscar dados de tracking por identificadores de sessão
export const getTrackingDataBySession = async (supabase: any, deviceData: any): Promise<{
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  match_type?: string;
} | null> => {
  try {
    console.log('🔍 Buscando dados de tracking por identificadores de sessão...');
    
    if (!deviceData) {
      console.log('❌ Nenhum dado do dispositivo disponível para correlação');
      return null;
    }
    
    // Gerar fingerprint a partir dos dados do dispositivo disponíveis
    const browserFingerprint = generateServerBrowserFingerprint(deviceData);
    
    console.log('🔍 Tentando correlacionar com:', {
      ip_address: deviceData.ip_address,
      user_agent: deviceData.user_agent?.substring(0, 50) + '...',
      browser_fingerprint: browserFingerprint
    });
    
    // Buscar nas últimas 4 horas
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    // Primeira tentativa: por IP e User Agent
    let trackingData = null;
    
    if (deviceData.ip_address && deviceData.user_agent) {
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('user_agent', deviceData.user_agent)
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        trackingData = data;
        console.log('✅ Encontrado por IP + User Agent:', trackingData[0].campaign_id);
      }
    }
    
    // Segunda tentativa: só por IP se não encontrou
    if ((!trackingData || trackingData.length === 0) && deviceData.ip_address) {
      console.log('🔍 Tentando busca apenas por IP...');
      
      const { data: ipData, error: ipError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!ipError && ipData && ipData.length > 0) {
        trackingData = ipData;
        console.log('✅ Encontrado por IP:', trackingData[0].campaign_id);
      }
    }
    
    // Terceira tentativa: por fingerprint se disponível
    if ((!trackingData || trackingData.length === 0) && browserFingerprint) {
      console.log('🔍 Tentando busca por browser fingerprint...');
      
      const { data: fingerprintData, error: fingerprintError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('browser_fingerprint', browserFingerprint)
        .gte('created_at', fourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!fingerprintError && fingerprintData && fingerprintData.length > 0) {
        trackingData = fingerprintData;
        console.log('✅ Encontrado por fingerprint:', trackingData[0].campaign_id);
      }
    }
    
    if (trackingData && trackingData.length > 0) {
      const session = trackingData[0];
      console.log('✅ Dados de tracking encontrados via correlação:', {
        campaign_id: session.campaign_id,
        utm_campaign: session.utm_campaign,
        created_at: session.created_at
      });
      
      return {
        campaign_id: session.campaign_id,
        utm_source: session.utm_source,
        utm_medium: session.utm_medium,
        utm_campaign: session.utm_campaign,
        utm_content: session.utm_content,
        utm_term: session.utm_term,
        match_type: 'session_correlation'
      };
    }
    
    console.log('❌ Nenhum dado de tracking encontrado via correlação');
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar tracking por sessão:', error);
    return null;
  }
};

// Gerar fingerprint do lado do servidor baseado nos dados disponíveis
const generateServerBrowserFingerprint = (deviceData: any): string | null => {
  if (!deviceData.user_agent) return null;
  
  try {
    const fingerprint = [
      deviceData.user_agent,
      deviceData.language || 'unknown',
      deviceData.screen_resolution || 'unknown',
      deviceData.timezone || 'unknown'
    ].join('|');
    
    // Criar hash simples
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('❌ Erro ao gerar fingerprint do servidor:', error);
    return null;
  }
};
