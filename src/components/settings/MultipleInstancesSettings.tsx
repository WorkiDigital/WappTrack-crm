import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Plus, Loader2 } from 'lucide-react';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import WhatsAppInstanceCard from './WhatsAppInstanceCard';

const MultipleInstancesSettings = () => {
  const { instances, loading, creating, createInstance, updateInstanceStatus, deleteInstance } = useWhatsAppInstances();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) return;

    try {
      await createInstance(instanceName.trim(), description.trim() || undefined);
      setInstanceName('');
      setDescription('');
      setIsDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteInstance = async (instanceId: string) => {
    if (confirm('Tem certeza que deseja remover esta instância? Esta ação não pode ser desfeita.')) {
      await deleteInstance(instanceId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Instâncias WhatsApp</span>
        </CardTitle>
        <CardDescription>
          Gerencie múltiplas instâncias do WhatsApp para diferentes equipes ou projetos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Minhas Instâncias</h3>
            <p className="text-sm text-muted-foreground">
              {instances.length} instância(s) configurada(s)
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nova Instância</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Instância</DialogTitle>
                <DialogDescription>
                  Configure uma nova instância do WhatsApp para conectar.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Instância *</Label>
                  <Input
                    id="instanceName"
                    placeholder="Ex: Vendas, Suporte, Marketing"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o propósito desta instância..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateInstance}
                  disabled={!instanceName.trim() || creating}
                >
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Instância
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando instâncias...</span>
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma instância configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira instância do WhatsApp para começar a receber leads.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Instância
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {instances.map((instance) => (
              <WhatsAppInstanceCard
                key={instance.id}
                instance={instance}
                onStatusUpdate={updateInstanceStatus}
                onDelete={handleDeleteInstance}
              />
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-2">Configuração do Webhook:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Cada instância terá seu próprio webhook configurado automaticamente</li>
            <li>URL do webhook: <code>https://qdilrnnfmjkunxmukoek.supabase.co/functions/v1/evolution-webhook</code></li>
            <li>Eventos: <code>messages.upsert</code></li>
            <li>Todas as mensagens recebidas serão processadas automaticamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultipleInstancesSettings;