
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campaign } from '@/types/campaign';

interface AdvancedTrackingSettingsProps {
  campaign: Partial<Campaign>;
  onCampaignChange: (campaign: Partial<Campaign>) => void;
}

const AdvancedTrackingSettings: React.FC<AdvancedTrackingSettingsProps> = ({
  campaign,
  onCampaignChange
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onCampaignChange({ ...campaign, [name]: value });
  };

  const handleSwitchChange = (field: keyof Campaign, checked: boolean) => {
    onCampaignChange({ ...campaign, [field]: checked });
  };

  const handleDataProcessingChange = (value: string) => {
    const options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
    onCampaignChange({ ...campaign, data_processing_options: options });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Configurações Avançadas de Tracking</h3>
      
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="conversion_api_enabled"
            checked={campaign.conversion_api_enabled || false}
            onCheckedChange={(checked) => handleSwitchChange('conversion_api_enabled', checked)}
          />
          <Label htmlFor="conversion_api_enabled">Ativar Conversions API</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="advanced_matching_enabled"
            checked={campaign.advanced_matching_enabled || false}
            onCheckedChange={(checked) => handleSwitchChange('advanced_matching_enabled', checked)}
          />
          <Label htmlFor="advanced_matching_enabled">Ativar Advanced Matching</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="server_side_api_enabled"
            checked={campaign.server_side_api_enabled || false}
            onCheckedChange={(checked) => handleSwitchChange('server_side_api_enabled', checked)}
          />
          <Label htmlFor="server_side_api_enabled">Ativar Server-Side API</Label>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="test_event_code">Código de Teste (Test Event Code)</Label>
          <Input
            id="test_event_code"
            name="test_event_code"
            value={campaign.test_event_code || ''}
            onChange={handleInputChange}
            placeholder="Ex: TEST12345"
          />
          <p className="text-xs text-muted-foreground">
            Usado para testar eventos no Facebook Events Manager
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="custom_audience_pixel_id">Pixel ID para Audiência Customizada</Label>
          <Input
            id="custom_audience_pixel_id"
            name="custom_audience_pixel_id"
            value={campaign.custom_audience_pixel_id || ''}
            onChange={handleInputChange}
            placeholder="Ex: 987654321098765"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tracking_domain">Domínio de Tracking</Label>
          <Input
            id="tracking_domain"
            name="tracking_domain"
            value={campaign.tracking_domain || ''}
            onChange={handleInputChange}
            placeholder="Ex: track.seudominio.com"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="external_id">ID Externo</Label>
          <Input
            id="external_id"
            name="external_id"
            value={campaign.external_id || ''}
            onChange={handleInputChange}
            placeholder="Ex: external_123456"
          />
          <p className="text-xs text-muted-foreground">
            Identificador único para integração com sistemas externos
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="data_processing_options">Opções de Processamento de Dados</Label>
          <Textarea
            id="data_processing_options"
            value={campaign.data_processing_options?.join(', ') || ''}
            onChange={(e) => handleDataProcessingChange(e.target.value)}
            placeholder="Ex: LDU, não usar dados para melhorias"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Separe as opções por vírgula. Ex: LDU (para California CCPA)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="data_processing_options_country">País (Código)</Label>
            <Input
              id="data_processing_options_country"
              name="data_processing_options_country"
              type="number"
              value={campaign.data_processing_options_country || ''}
              onChange={handleInputChange}
              placeholder="Ex: 1 (USA)"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="data_processing_options_state">Estado (Código)</Label>
            <Input
              id="data_processing_options_state"
              name="data_processing_options_state"
              type="number"
              value={campaign.data_processing_options_state || ''}
              onChange={handleInputChange}
              placeholder="Ex: 1000 (California)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTrackingSettings;
