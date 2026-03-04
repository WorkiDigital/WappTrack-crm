
import { supabase } from '@/integrations/supabase/client';

export interface DeviceDataCapture {
  phone: string;
  ip_address?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  device_model?: string;
  location?: string;
  country?: string;
  city?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  facebook_ad_id?: string;
  facebook_adset_id?: string;
  facebook_campaign_id?: string;
}

// Função para capturar dados básicos do dispositivo
export const captureDeviceData = async (phone?: string): Promise<DeviceDataCapture> => {
  console.log('📱 [DEVICE DATA SERVICE] Iniciando captura de dados...');
  
  try {
    // Dados básicos que sempre conseguimos capturar
    const basicData: DeviceDataCapture = {
      phone: phone || '',
      browser: getBrowserInfo(),
      os: getOSInfo(),
      device_type: getDeviceType(),
      device_model: getDeviceModel(),
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    };

    console.log('✅ [DEVICE DATA SERVICE] Dados básicos capturados:', basicData);

    // Tentar capturar localização se disponível
    try {
      const locationData = await getLocationData();
      Object.assign(basicData, locationData);
      console.log('✅ [DEVICE DATA SERVICE] Dados de localização adicionados');
    } catch (error) {
      console.warn('⚠️ [DEVICE DATA SERVICE] Não foi possível obter localização:', error);
    }

    // Capturar dados do Facebook se disponíveis
    try {
      const facebookData = getFacebookData();
      Object.assign(basicData, facebookData);
      console.log('✅ [DEVICE DATA SERVICE] Dados do Facebook adicionados');
    } catch (error) {
      console.warn('⚠️ [DEVICE DATA SERVICE] Dados do Facebook não disponíveis:', error);
    }

    return basicData;
  } catch (error) {
    console.error('❌ [DEVICE DATA SERVICE] Erro na captura:', error);
    throw error;
  }
};

// Função para salvar dados do dispositivo no banco
export const saveDeviceData = async (data: DeviceDataCapture): Promise<void> => {
  if (!data.phone) {
    throw new Error('Telefone é obrigatório para salvar dados do dispositivo');
  }

  console.log('💾 [DEVICE DATA SERVICE] Salvando dados no banco para:', data.phone);

  try {
    const { error } = await supabase
      .from('device_data')
      .insert({
        phone: data.phone,
        ip_address: data.ip_address || '',
        browser: data.browser || '',
        os: data.os || '',
        device_type: data.device_type || '',
        device_model: data.device_model || '',
        location: data.location || '',
        country: data.country || '',
        city: data.city || '',
        screen_resolution: data.screen_resolution || '',
        timezone: data.timezone || '',
        language: data.language || '',
        facebook_ad_id: data.facebook_ad_id || '',
        facebook_adset_id: data.facebook_adset_id || '',
        facebook_campaign_id: data.facebook_campaign_id || ''
      });

    if (error) {
      console.error('❌ [DEVICE DATA SERVICE] Erro ao salvar no banco:', error);
      throw error;
    }

    console.log('✅ [DEVICE DATA SERVICE] Dados salvos com sucesso no banco');
  } catch (error) {
    console.error('❌ [DEVICE DATA SERVICE] Erro geral ao salvar:', error);
    throw error;
  }
};

// Função para buscar dados do dispositivo por telefone
export const getDeviceDataByPhone = async (phone: string): Promise<DeviceDataCapture | null> => {
  if (!phone) return null;

  console.log('🔍 [DEVICE DATA SERVICE] Buscando dados salvos para:', phone);

  try {
    // Buscar dados salvos nas últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ [DEVICE DATA SERVICE] Erro ao buscar dados:', error);
      return null;
    }

    if (data && data.length > 0) {
      const deviceData = data[0];
      console.log('✅ [DEVICE DATA SERVICE] Dados encontrados:', {
        device_type: deviceData.device_type,
        browser: deviceData.browser,
        location: deviceData.location
      });

      return {
        phone: deviceData.phone,
        ip_address: deviceData.ip_address,
        browser: deviceData.browser,
        os: deviceData.os,
        device_type: deviceData.device_type,
        device_model: deviceData.device_model,
        location: deviceData.location,
        country: deviceData.country,
        city: deviceData.city,
        screen_resolution: deviceData.screen_resolution,
        timezone: deviceData.timezone,
        language: deviceData.language,
        facebook_ad_id: deviceData.facebook_ad_id,
        facebook_adset_id: deviceData.facebook_adset_id,
        facebook_campaign_id: deviceData.facebook_campaign_id
      };
    }

    console.log('❌ [DEVICE DATA SERVICE] Nenhum dado encontrado para:', phone);
    return null;
  } catch (error) {
    console.error('❌ [DEVICE DATA SERVICE] Erro geral na busca:', error);
    return null;
  }
};

// Funções auxiliares para captura de dados
function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSInfo(): string {
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  
  if (platform.includes('Win')) return 'Windows';
  if (platform.includes('Mac')) return 'macOS';
  if (platform.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return platform || 'Unknown';
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

function getDeviceModel(): string {
  const userAgent = navigator.userAgent;
  
  // Tentar extrair modelo do dispositivo
  const iPhoneMatch = userAgent.match(/iPhone\s+OS\s+([\d_]+)/);
  if (iPhoneMatch) return 'iPhone';
  
  const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
  if (androidMatch) return 'Android';
  
  return 'Unknown';
}

async function getLocationData(): Promise<Partial<DeviceDataCapture>> {
  try {
    // Tentar obter IP e localização via API externa
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      ip_address: data.ip,
      country: data.country_name,
      city: data.city,
      location: `${data.city}, ${data.country_name}`
    };
  } catch (error) {
    console.warn('⚠️ Não foi possível obter dados de localização:', error);
    return {};
  }
}

function getFacebookData(): Partial<DeviceDataCapture> {
  // Tentar capturar dados do Facebook dos parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    facebook_ad_id: urlParams.get('facebook_ad_id') || '',
    facebook_adset_id: urlParams.get('facebook_adset_id') || '',
    facebook_campaign_id: urlParams.get('facebook_campaign_id') || ''
  };
}
