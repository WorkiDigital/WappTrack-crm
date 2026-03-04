import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Wifi, 
  WifiOff, 
  Loader2, 
  Trash2, 
  QrCode,
  AlertCircle
} from 'lucide-react';
import { WhatsAppInstance } from '@/hooks/useWhatsAppInstances';
import { evolutionService } from '@/services/evolutionService';
import { toast } from 'sonner';
import QRCodeDisplay from '@/components/QRCodeDisplay';

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  onStatusUpdate: (instanceId: string, status: WhatsAppInstance['status']) => void;
  onDelete: (instanceId: string) => void;
}

const WhatsAppInstanceCard = ({ instance, onStatusUpdate, onDelete }: WhatsAppInstanceCardProps) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [qrError, setQrError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const getStatusColor = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: WhatsAppInstance['status']) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setIsLoadingQR(true);
    setQrError('');
    setQrCode('');
    setShowQR(true);

    try {
      onStatusUpdate(instance.id, 'connecting');
      
      const response = await evolutionService.getQRCode(instance.name);

      if (response.success && response.qrcode) {
        setQrCode(response.qrcode);
        toast.success('QR Code gerado com sucesso!');
        
        // Check status periodically
        const checkStatus = setInterval(async () => {
          const statusResponse = await evolutionService.getInstanceStatus(instance.name);
          if (statusResponse.success && statusResponse.status === 'open') {
            onStatusUpdate(instance.id, 'connected');
            setShowQR(false);
            toast.success('WhatsApp conectado com sucesso!');
            clearInterval(checkStatus);
          }
        }, 3000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkStatus), 300000);
      } else {
        setQrError(response.error || 'Erro ao gerar QR Code');
        onStatusUpdate(instance.id, 'error');
      }
    } catch (error: any) {
      setQrError(error.message || 'Erro ao conectar');
      onStatusUpdate(instance.id, 'error');
    } finally {
      setIsLoadingQR(false);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    
    try {
      onStatusUpdate(instance.id, 'connecting');
      
      const response = await evolutionService.disconnectInstance(instance.name);

      if (response.success) {
        onStatusUpdate(instance.id, 'disconnected');
        setQrCode('');
        setQrError('');
        setShowQR(false);
        toast.success('Desconectado com sucesso!');
      } else {
        onStatusUpdate(instance.id, 'error');
        toast.error('Erro ao desconectar: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      onStatusUpdate(instance.id, 'error');
      toast.error('Erro ao desconectar: ' + error.message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefreshQR = () => {
    handleConnect();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">{instance.name}</h3>
              {instance.description && (
                <p className="text-sm text-muted-foreground">{instance.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.status)}`} />
              <span>{getStatusText(instance.status)}</span>
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(instance.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {instance.status === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : instance.status === 'connecting' ? (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
            ) : instance.status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm">
              {instance.status === 'connected' ? 'Pronto para receber mensagens' :
               instance.status === 'connecting' ? 'Aguardando conexão...' :
               instance.status === 'error' ? 'Erro na conexão' :
               'Aguardando conexão'}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {instance.status !== 'connected' ? (
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                size="sm"
                className="flex items-center space-x-1"
              >
                <QrCode className="w-4 h-4" />
                <span>{isConnecting ? 'Conectando...' : 'Conectar'}</span>
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
                size="sm"
                className="flex items-center space-x-1"
              >
                <WifiOff className="w-4 h-4" />
                <span>{isDisconnecting ? 'Desconectando...' : 'Desconectar'}</span>
              </Button>
            )}
          </div>
        </div>

        {showQR && (qrCode || isLoadingQR || qrError) && (
          <QRCodeDisplay
            qrCode={qrCode}
            isLoading={isLoadingQR}
            error={qrError}
            onRefresh={handleRefreshQR}
          />
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <p><strong>Webhook:</strong> {instance.webhook_url}</p>
          <p><strong>Criado em:</strong> {new Date(instance.created_at).toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceCard;