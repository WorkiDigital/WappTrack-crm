
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCode?: string;
  isLoading: boolean;
  error?: string;
  onRefresh: () => void;
}

const QRCodeDisplay = ({ qrCode, isLoading, error, onRefresh }: QRCodeDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          QR Code WhatsApp
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {isLoading && (
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Gerando QR Code...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-center">
            <p>Erro ao gerar QR Code:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {qrCode && !isLoading && (
          <div className="flex flex-col items-center space-y-2">
            <img 
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code WhatsApp"
              className="border rounded-lg"
              style={{ maxWidth: '300px', maxHeight: '300px' }}
            />
            <p className="text-sm text-muted-foreground text-center">
              Escaneie este QR Code com o WhatsApp para conectar a instância
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
