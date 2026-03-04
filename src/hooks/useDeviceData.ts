
import { useState, useEffect } from 'react';
import { captureDeviceData, saveDeviceData, type DeviceDataCapture } from '@/services/deviceDataService';

export const useDeviceData = (phone?: string) => {
  const [deviceData, setDeviceData] = useState<DeviceDataCapture | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Capturar dados do dispositivo automaticamente quando o hook é usado
  useEffect(() => {
    const loadDeviceData = async () => {
      setIsLoading(true);
      setCaptureError(null);
      
      try {
        console.log('📱 [DEVICE DATA] Iniciando captura automática de dados do dispositivo...');
        const data = await captureDeviceData(phone);
        setDeviceData(data);
        
        console.log('✅ [DEVICE DATA] Dados capturados com sucesso:', {
          device_type: data.device_type,
          browser: data.browser,
          location: data.location,
          phone: phone || 'sem telefone'
        });
        
        // Salvar automaticamente se tiver telefone
        if (phone) {
          console.log('💾 [DEVICE DATA] Salvando dados automaticamente para telefone:', phone);
          await saveDeviceData(data);
          console.log('✅ [DEVICE DATA] Dados salvos automaticamente');
        } else {
          console.log('⚠️ [DEVICE DATA] Dados capturados mas não salvos (sem telefone)');
        }
      } catch (error) {
        console.error('❌ [DEVICE DATA] Erro ao capturar dados do dispositivo:', error);
        setCaptureError(error instanceof Error ? error.message : 'Erro desconhecido');
        
        // Criar dados básicos mesmo com erro
        const basicData: DeviceDataCapture = {
          phone: phone || '',
          device_type: 'unknown',
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Unknown',
          os: navigator.platform || 'Unknown',
          ip_address: '',
          location: '',
          country: '',
          city: '',
          screen_resolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        };
        
        setDeviceData(basicData);
        console.log('⚠️ [DEVICE DATA] Usando dados básicos devido ao erro:', basicData);
      } finally {
        setIsLoading(false);
      }
    };

    loadDeviceData();
  }, [phone]);

  // Função para capturar e salvar dados com telefone
  const captureAndSave = async (phoneNumber?: string) => {
    setIsLoading(true);
    setCaptureError(null);
    
    try {
      console.log('📱 [DEVICE DATA] Captura manual iniciada para telefone:', phoneNumber);
      const data = await captureDeviceData(phoneNumber);
      setDeviceData(data);
      
      if (phoneNumber) {
        console.log('💾 [DEVICE DATA] Salvando dados para telefone:', phoneNumber);
        await saveDeviceData(data);
        console.log('✅ [DEVICE DATA] Dados salvos com sucesso');
      }
      
      return data;
    } catch (error) {
      console.error('❌ [DEVICE DATA] Erro ao capturar e salvar dados:', error);
      setCaptureError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Dados básicos como fallback
      const basicData: DeviceDataCapture = {
        phone: phoneNumber || '',
        device_type: 'unknown',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Unknown',
        os: navigator.platform || 'Unknown',
        ip_address: '',
        location: '',
        country: '',
        city: '',
        screen_resolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language
      };
      
      if (phoneNumber) {
        try {
          await saveDeviceData(basicData);
          console.log('✅ [DEVICE DATA] Dados básicos salvos como fallback');
        } catch (saveError) {
          console.error('❌ [DEVICE DATA] Erro ao salvar dados básicos:', saveError);
        }
      }
      
      setDeviceData(basicData);
      return basicData;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deviceData,
    isLoading,
    captureAndSave,
    captureError
  };
};
