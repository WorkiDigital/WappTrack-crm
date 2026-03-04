
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2 } from 'lucide-react';
import { Campaign } from '@/types';
import { formatDate } from '@/lib/utils';

interface CampaignTableProps {
  campaigns: Campaign[];
  isLoading: boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
  onCopyTrackingUrl: (campaign: Campaign) => void;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  isLoading,
  onEdit,
  onDelete,
  onCopyTrackingUrl
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-medium">Nome</th>
                <th className="p-4 text-left font-medium">Origem</th>
                <th className="p-4 text-left font-medium">Meio</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Data</th>
                <th className="p-4 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    Carregando campanhas...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    Nenhuma campanha encontrada
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b">
                    <td className="p-4">{campaign.name}</td>
                    <td className="p-4">{campaign.utm_source || '-'}</td>
                    <td className="p-4">{campaign.utm_medium || '-'}</td>
                    <td className="p-4">
                      {campaign.active ? (
                        <Badge variant="default" className="bg-primary">Ativa</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </td>
                    <td className="p-4">{formatDate(campaign.created_at)}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCopyTrackingUrl(campaign)}
                        title="Copiar URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(campaign)}
                        title="Editar campanha"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(campaign.id)}
                        title="Excluir campanha"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignTable;
