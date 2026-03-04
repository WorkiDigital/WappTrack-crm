
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Tablet, MapPin, Globe, Clock } from 'lucide-react';

interface DeviceInfo {
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
}

interface DeviceInfoDisplayProps {
  deviceInfo: DeviceInfo;
}

const DeviceInfoDisplay = ({ deviceInfo }: DeviceInfoDisplayProps) => {
  const getDeviceIcon = () => {
    switch (deviceInfo.device_type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceTypeColor = () => {
    switch (deviceInfo.device_type?.toLowerCase()) {
      case 'mobile':
        return 'bg-green-100 text-green-800';
      case 'tablet':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          {getDeviceIcon()}
          <span>Informações do Dispositivo</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Localização */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Localização:</span>
          </div>
          <div className="ml-6 text-sm text-gray-600">
            {deviceInfo.location || 'Não disponível'}
          </div>
        </div>

        {/* Informações do Dispositivo */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Informações do Dispositivo</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">IP:</span>
              <span className="text-sm font-mono">{deviceInfo.ip_address || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Navegador:</span>
              <span className="text-sm">{deviceInfo.browser || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sistema operacional:</span>
              <span className="text-sm">{deviceInfo.os || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tipo de aparelho:</span>
              <Badge className={getDeviceTypeColor()}>
                {deviceInfo.device_type || 'N/A'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Modelo do aparelho:</span>
              <span className="text-sm">{deviceInfo.device_model || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Informações Técnicas</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Resolução:</span>
              <span className="text-sm font-mono">{deviceInfo.screen_resolution || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Fuso horário:</span>
              <span className="text-sm">{deviceInfo.timezone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Idioma:</span>
              <span className="text-sm">{deviceInfo.language || 'N/A'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceInfoDisplay;
