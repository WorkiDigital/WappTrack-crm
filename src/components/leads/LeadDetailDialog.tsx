
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Calendar, Phone, Tag, ExternalLink, Edit, Save, X } from 'lucide-react';
import { Lead } from '@/types';
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DeviceInfoDisplay from './DeviceInfoDisplay';
import { LeadStatusBadge } from './LeadStatusBadge';
import { FUNNEL_STATUSES, ALL_STATUSES } from '@/constants/funnelStatuses';
import { agentService } from '@/services/agentService';
import { AgentWithRelations } from '@/types/agent';
import { Bot, RefreshCw, Layers, Database, ChevronRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface LeadDetailDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: Partial<Lead>) => Promise<void>;
  onOpenWhatsApp: (phone: string) => void;
}

const LeadDetailDialog = ({ lead, isOpen, onClose, onSave, onOpenWhatsApp }: LeadDetailDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [agents, setAgents] = useState<AgentWithRelations[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    try {
      setIsLoadingAgents(true);
      const data = await agentService.getAgents();
      setAgents(data as AgentWithRelations[]);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  if (!lead) return null;

  const handleEdit = () => {
    setEditData({
      name: lead.name,
      status: lead.status,
      notes: lead.notes || '',
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_content: lead.utm_content || '',
      utm_term: lead.utm_term || '',
      agent_id: lead.agent_id || 'none',
      current_stage_id: lead.current_stage_id || 'unassigned'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const openWhatsApp = () => {
    onOpenWhatsApp(lead.phone);
  };


  // Extrair dados do dispositivo tanto do custom_fields quanto dos novos campos diretos
  const deviceInfo = (typeof lead.custom_fields?.device_info === 'object' && lead.custom_fields.device_info !== null)
    ? lead.custom_fields.device_info as any
    : {
      ip_address: lead.ip_address,
      browser: lead.browser,
      os: lead.os,
      device_type: lead.device_type,
      device_model: lead.device_model,
      location: lead.location,
      country: lead.country,
      city: lead.city,
      screen_resolution: lead.screen_resolution,
      timezone: lead.timezone,
      language: lead.language
    };

  // Verificar se há dados de dispositivo válidos
  const hasDeviceData = deviceInfo && (
    deviceInfo.device_type ||
    deviceInfo.browser ||
    deviceInfo.os ||
    deviceInfo.location ||
    deviceInfo.ip_address
  );

  // Extrair GCLID e FBCLID dos parâmetros UTM
  const extractParam = (content: string | undefined, param: string) => {
    if (!content) return null;
    const match = content.match(new RegExp(`${param}=([^&]+)`));
    return match ? match[1] : null;
  };

  const gclid = extractParam(lead.utm_content, 'gclid') || extractParam(lead.utm_term, 'gclid');
  const fbclid = extractParam(lead.utm_content, 'fbclid') || extractParam(lead.utm_term, 'fbclid');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Lead</span>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Informações Básicas</TabsTrigger>
            <TabsTrigger value="device">Dispositivo</TabsTrigger>
            <TabsTrigger value="utm">Parâmetros de URL</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              Agente IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Lead</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{lead.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm">{formatBrazilianPhone(lead.phone)}</span>
                      <Button onClick={openWhatsApp} variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    {isEditing ? (
                      <Select
                        value={editData.status || lead.status}
                        onValueChange={(value: Lead['status']) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                    ) : (
                      <LeadStatusBadge status={lead.status} />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Campanha</Label>
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{lead.campaign}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mensagens e Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.last_message && (
                    <div className="space-y-2">
                      <Label>Última Mensagem</Label>
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-1" />
                        <p className="text-sm bg-gray-50 p-2 rounded">{lead.last_message}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Primeiro Contato</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {lead.first_contact_date
                          ? format(new Date(lead.first_contact_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Não disponível'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Último Contato</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        {lead.last_contact_date
                          ? format(new Date(lead.last_contact_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Não disponível'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Adicione suas observações sobre este lead..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{lead.notes || 'Nenhuma observação'}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="device" className="space-y-4">
            {hasDeviceData ? (
              <DeviceInfoDisplay deviceInfo={deviceInfo} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <p className="text-gray-500">Nenhuma informação de dispositivo disponível para este lead.</p>
                    <p className="text-xs text-gray-400">
                      Os dados são coletados automaticamente quando o lead interage com o formulário de contato.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="utm" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parâmetros de URL</CardTitle>
                <CardDescription>Informações de origem e rastreamento do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utm_source">UTM Source</Label>
                    {isEditing ? (
                      <Input
                        id="utm_source"
                        value={editData.utm_source || ''}
                        onChange={(e) => setEditData({ ...editData, utm_source: e.target.value })}
                        placeholder="facebook, google, etc."
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_source || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    {isEditing ? (
                      <Input
                        id="utm_medium"
                        value={editData.utm_medium || ''}
                        onChange={(e) => setEditData({ ...editData, utm_medium: e.target.value })}
                        placeholder="cpc, social, email, etc."
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_medium || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    {isEditing ? (
                      <Input
                        id="utm_campaign"
                        value={editData.utm_campaign || ''}
                        onChange={(e) => setEditData({ ...editData, utm_campaign: e.target.value })}
                        placeholder="Nome da campanha"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_campaign || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_content">UTM Content</Label>
                    {isEditing ? (
                      <Input
                        id="utm_content"
                        value={editData.utm_content || ''}
                        onChange={(e) => setEditData({ ...editData, utm_content: e.target.value })}
                        placeholder="Identificador do conteúdo"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_content || 'Não disponível'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="utm_term">UTM Term</Label>
                    {isEditing ? (
                      <Input
                        id="utm_term"
                        value={editData.utm_term || ''}
                        onChange={(e) => setEditData({ ...editData, utm_term: e.target.value })}
                        placeholder="Palavras-chave ou termos"
                      />
                    ) : (
                      <p className="text-sm">{lead.utm_term || 'Não disponível'}</p>
                    )}
                  </div>

                  {/* 🎯 NOVOS CAMPOS DO FACEBOOK ADS */}
                  {lead.facebook_ad_id && (
                    <div className="space-y-2">
                      <Label>Facebook Ad ID</Label>
                      <p className="text-sm font-mono">{lead.facebook_ad_id}</p>
                    </div>
                  )}

                  {lead.facebook_adset_id && (
                    <div className="space-y-2">
                      <Label>Facebook Adset ID</Label>
                      <p className="text-sm font-mono">{lead.facebook_adset_id}</p>
                    </div>
                  )}

                  {lead.facebook_campaign_id && (
                    <div className="space-y-2">
                      <Label>Facebook Campaign ID</Label>
                      <p className="text-sm font-mono">{lead.facebook_campaign_id}</p>
                    </div>
                  )}

                  {gclid && (
                    <div className="space-y-2">
                      <Label>GCLID</Label>
                      <p className="text-sm font-mono">{gclid}</p>
                    </div>
                  )}

                  {fbclid && (
                    <div className="space-y-2">
                      <Label>FBCLID</Label>
                      <p className="text-sm font-mono">{fbclid}</p>
                    </div>
                  )}
                </div>

                {lead.evolution_message_id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Informações do WhatsApp</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Message ID:</strong> {lead.evolution_message_id}</p>
                      <p><strong>Status:</strong> {lead.evolution_status || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Controle de Inteligência Artificial
                </CardTitle>
                <CardDescription>Gerencie o atendimento automatizado para este lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Seleção de Agente */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><RefreshCw className="w-3 h-3" /> Agente Responsável</Label>
                    {isEditing ? (
                      <Select
                        value={editData.agent_id || 'none'}
                        onValueChange={(value) => setEditData({ ...editData, agent_id: value === 'none' ? null : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (Manual)</SelectItem>
                          {agents.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        {lead.agent_id ? (
                          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                            {agents.find(a => a.id === lead.agent_id)?.name || 'Agente Ativo'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo / Manual</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Etapa Atual */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Layers className="w-3 h-3" /> Etapa Atual</Label>
                    {isEditing ? (
                      <Select
                        value={editData.current_stage_id || 'unassigned'}
                        onValueChange={(value) => setEditData({ ...editData, current_stage_id: value === 'unassigned' ? null : value })}
                        disabled={!editData.agent_id || editData.agent_id === 'none'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a etapa..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Não definida</SelectItem>
                          {(agents.find(a => a.id === (editData.agent_id || lead.agent_id)) as any)?.agent_stages?.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        {lead.current_stage_id ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {(agents.find(a => a.id === lead.agent_id) as any)?.agent_stages?.find((s: any) => s.id === lead.current_stage_id)?.name || 'Etapa Definida'}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não iniciada</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Variáveis Coletadas */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    <Database className="w-4 h-4" /> Dados Coletados pela IA
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lead.collected_variables && Object.keys(lead.collected_variables).length > 0 ? (
                      Object.entries(lead.collected_variables).map(([key, value]) => (
                        <div key={key} className="p-3 bg-muted/30 rounded-lg border border-border/50 flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium">{String(value)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6 border-2 border-dashed rounded-lg opacity-40">
                        <p className="text-xs italic">Nenhum dado coletado ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailDialog;
