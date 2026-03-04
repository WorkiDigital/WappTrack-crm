
// Handler para buscar dados do dispositivo salvos no banco de dados
export const getDeviceDataByPhone = async (supabase: any, phone: string): Promise<{
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
} | null> => {
  try {
    console.log(`🔍 Buscando dados do dispositivo no banco para: ${phone}`);
    
    // Buscar dados do dispositivo salvos nas últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: deviceData, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar dados do dispositivo no banco:', error);
      return null;
    }

    if (deviceData && deviceData.length > 0) {
      const device = deviceData[0];
      console.log('✅ Dados do dispositivo encontrados no banco:', {
        device_type: device.device_type,
        browser: device.browser,
        os: device.os,
        location: device.location,
        created_at: device.created_at
      });
      
      return {
        ip_address: device.ip_address,
        browser: device.browser,
        os: device.os,
        device_type: device.device_type,
        device_model: device.device_model,
        location: device.location,
        country: device.country,
        city: device.city,
        screen_resolution: device.screen_resolution,
        timezone: device.timezone,
        language: device.language
      };
    }

    console.log('❌ Nenhum dado do dispositivo encontrado no banco para:', phone);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar dados do dispositivo no banco:', error);
    return null;
  }
};
