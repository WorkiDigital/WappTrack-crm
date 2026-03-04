import React from 'react';
import { Lead, Campaign } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { FUNNEL_STATUSES, ALL_STATUSES } from '@/constants/funnelStatuses';

interface LeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  currentLead: Partial<Lead>;
  campaigns: Campaign[];
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const LeadDialog: React.FC<LeadDialogProps> = ({
  isOpen,
  onClose,
  mode,
  currentLead,
  campaigns,
  onSave,
  onInputChange,
  onPhoneChange,
  onSelectChange
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Adicionar Novo Lead' : 'Editar Lead'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Preencha os detalhes para adicionar um novo lead.'
              : 'Atualize os detalhes do lead.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={currentLead.name || ''}
              onChange={onInputChange}
              placeholder="Nome do lead"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                +55
              </div>
              <Input
                id="phone"
                name="phone"
                value={currentLead.phone || ''}
                onChange={onPhoneChange}
                placeholder="(85) 99999-9999 ou (85) 9999-9999"
                className="pl-12"
                maxLength={16}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o DDD e número (8 ou 9 dígitos). Ex: 85998372658 ou 8598372658
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campaign">Campanha</Label>
            <Select 
              value={currentLead.campaign || ''} 
              onValueChange={(value) => onSelectChange('campaign', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.name}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={currentLead.status || ''} 
              onValueChange={(value) => onSelectChange('status', value as Lead['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((status) => {
                  const config = FUNNEL_STATUSES[status];
                  return (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {mode === 'edit' && currentLead.last_message && (
            <div className="grid gap-2">
              <Label htmlFor="last_message">Última Mensagem (Somente Leitura)</Label>
              <Textarea
                id="last_message"
                value={currentLead.last_message}
                readOnly
                className="bg-muted/50 resize-none"
                rows={2}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="first_contact_date">Data do Primeiro Contato</Label>
            <Input
              id="first_contact_date"
              name="first_contact_date"
              type="datetime-local"
              value={currentLead.first_contact_date ? new Date(currentLead.first_contact_date).toISOString().slice(0, 16) : ''}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_contact_date">Data do Último Contato</Label>
            <Input
              id="last_contact_date"
              name="last_contact_date"
              type="datetime-local"
              value={currentLead.last_contact_date ? new Date(currentLead.last_contact_date).toISOString().slice(0, 16) : ''}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={currentLead.notes || ''}
              onChange={onInputChange}
              placeholder="Observações sobre o lead"
            />
          </div>
          {/* Se existirem dados UTM, mostrar seção */}
          {(currentLead.utm_source ||
            currentLead.utm_medium ||
            currentLead.utm_campaign ||
            currentLead.utm_content ||
            currentLead.utm_term) && (
            <div className="grid gap-2 border-t pt-4">
              <div>
                <Label className="font-bold">Dados UTM (origem do lead)</Label>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {currentLead.utm_source && (
                  <div>
                    <Label className="text-xs text-muted-foreground">utm_source</Label>
                    <Input value={currentLead.utm_source} readOnly className="bg-muted/50" />
                  </div>
                )}
                {currentLead.utm_medium && (
                  <div>
                    <Label className="text-xs text-muted-foreground">utm_medium</Label>
                    <Input value={currentLead.utm_medium} readOnly className="bg-muted/50" />
                  </div>
                )}
                {currentLead.utm_campaign && (
                  <div>
                    <Label className="text-xs text-muted-foreground">utm_campaign</Label>
                    <Input value={currentLead.utm_campaign} readOnly className="bg-muted/50" />
                  </div>
                )}
                {currentLead.utm_content && (
                  <div>
                    <Label className="text-xs text-muted-foreground">utm_content</Label>
                    <Input value={currentLead.utm_content} readOnly className="bg-muted/50" />
                  </div>
                )}
                {currentLead.utm_term && (
                  <div>
                    <Label className="text-xs text-muted-foreground">utm_term</Label>
                    <Input value={currentLead.utm_term} readOnly className="bg-muted/50" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            {mode === 'add' ? 'Adicionar' : 'Atualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDialog;
