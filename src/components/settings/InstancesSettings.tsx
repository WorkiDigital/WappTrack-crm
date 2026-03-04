
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppInstance {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

const InstancesSettings = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([
    {
      id: '1',
      name: 'principal',
      description: 'Instância principal do WhatsApp Business',
      status: 'active'
    }
  ]);
  
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDescription, setNewInstanceDescription] = useState('');

  const handleAddInstance = () => {
    if (!newInstanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    const newInstance: WhatsAppInstance = {
      id: Date.now().toString(),
      name: newInstanceName.toLowerCase().replace(/\s+/g, '_'),
      description: newInstanceDescription || 'Nova instância do WhatsApp',
      status: 'inactive'
    };

    setInstances([...instances, newInstance]);
    setNewInstanceName('');
    setNewInstanceDescription('');
    toast.success('Nova instância adicionada');
  };

  const handleRemoveInstance = (id: string) => {
    setInstances(instances.filter(instance => instance.id !== id));
    toast.success('Instância removida');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Instâncias WhatsApp
        </CardTitle>
        <CardDescription>
          Configure as instâncias do WhatsApp que receberão leads orgânicos.
          Cada instância pode ser associada a diferentes campanhas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de instâncias existentes */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Instâncias Configuradas</h3>
          {instances.map((instance) => (
            <div key={instance.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{instance.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    instance.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {instance.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {instance.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveInstance(instance.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Adicionar nova instância */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-medium">Adicionar Nova Instância</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância</Label>
              <Input
                id="instanceName"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="ex: principal, suporte, vendas"
              />
              <p className="text-xs text-muted-foreground">
                Nome usado para identificar a instância no Evolution API
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instanceDescription">Descrição (opcional)</Label>
              <Input
                id="instanceDescription"
                value={newInstanceDescription}
                onChange={(e) => setNewInstanceDescription(e.target.value)}
                placeholder="Descrição da instância"
              />
            </div>
          </div>
          <Button onClick={handleAddInstance} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Instância
          </Button>
        </div>

        {/* Informações importantes */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cada instância do WhatsApp pode receber leads orgânicos</li>
            <li>• O sistema identifica automaticamente qual usuário deve receber o lead</li>
            <li>• Leads são associados ao primeiro usuário com campanhas ativas</li>
            <li>• Configure o webhook do Evolution API para: <code className="bg-blue-100 px-1 rounded">https://[sua-url]/functions/v1/evolution-webhook</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstancesSettings;
