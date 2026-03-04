import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Smartphone, Instagram, Zap, Book } from 'lucide-react';
import { AgentWithRelations } from '@/types/agent';
import { agentService } from '@/services/agentService';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';

interface AgentConnectionsTabProps {
    agent: AgentWithRelations;
    onUpdate: () => void;
}

export const AgentConnectionsTab = ({ agent, onUpdate }: AgentConnectionsTabProps) => {
    const [newTrigger, setNewTrigger] = useState('');
    const [newChannelId, setNewChannelId] = useState('');
    const { instances: rawInstances } = useWhatsAppInstances();
    const instances = (rawInstances || []) as any[];

    const handleAddTrigger = async () => {
        if (!newTrigger) return;
        try {
            await agentService.createTrigger({
                agent_id: agent.id,
                phrase: newTrigger
            });
            toast.success('Gatilho adicionado');
            setNewTrigger('');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao adicionar gatilho');
        }
    };

    const handleDeleteTrigger = async (id: string) => {
        try {
            await agentService.deleteTrigger(id);
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao remover gatilho');
        }
    };

    const handleAddChannel = async () => {
        if (!newChannelId || newChannelId === 'none') return;

        if (agent.channels?.some(c => c.channel_id === newChannelId)) {
            toast.error('Este canal já está vinculado ao agente');
            return;
        }

        try {
            await agentService.createChannel({
                agent_id: agent.id,
                channel_type: 'whatsapp',
                channel_id: newChannelId
            });
            toast.success('Canal vinculado com sucesso');
            setNewChannelId('');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao vincular canal');
        }
    };

    const handleDeleteChannel = async (id: string) => {
        try {
            await agentService.deleteChannel(id);
            toast.success('Canal removido');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao remover canal');
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" /> Gatilhos de Ativação
                    </CardTitle>
                    <CardDescription>Frases que ativam o agente automaticamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={newTrigger}
                            onChange={(e) => setNewTrigger(e.target.value)}
                            placeholder="Ex: Quero saber mais"
                        />
                        <Button size="icon" onClick={handleAddTrigger}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {agent.triggers?.map((trigger) => (
                            <Badge key={trigger.id} variant="secondary" className="pl-3 pr-1 py-1 gap-2">
                                {trigger.phrase}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-transparent hover:text-destructive"
                                    onClick={() => handleDeleteTrigger(trigger.id)}
                                >
                                    <Plus className="h-3 w-3 rotate-45" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        < Smartphone className="h-5 w-5 text-green-500" /> Canais Vinculados
                    </CardTitle>
                    <CardDescription>WhatsApp e Instagram que este agente monitora.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <Label>Adicionar Canal do WhatsApp</Label>
                            <div className="flex gap-2">
                                <Select value={newChannelId} onValueChange={setNewChannelId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione uma instância..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {instances.map((instance) => (
                                            <SelectItem key={instance.id} value={instance.id}>
                                                {instance.instance_name || 'Sem nome'} ({instance.status})
                                            </SelectItem>
                                        ))}
                                        {instances.length === 0 && (
                                            <SelectItem value="none" disabled>Nenhuma instância cadastrada</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleAddChannel}
                                    disabled={!newChannelId || newChannelId === 'none'}
                                >
                                    Vincular
                                </Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            {agent.channels?.map((channel) => (
                                <div key={channel.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                                    <div className="flex items-center gap-2">
                                        {channel.channel_type === 'whatsapp' ? <Smartphone className="h-4 w-4 text-green-500" /> : <Instagram className="h-4 w-4 text-pink-500" />}
                                        <span className="text-sm font-medium">
                                            {channel.channel_type === 'whatsapp'
                                                ? instances.find(i => i.id === channel.channel_id)?.instance_name || channel.channel_id
                                                : channel.channel_id}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteChannel(channel.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {(!agent.channels || agent.channels.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum canal configurado.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Book className="h-5 w-5 text-blue-500" /> Bases de Conhecimento Reutilizáveis
                    </CardTitle>
                    <CardDescription>Documentos globais que este agente pode consultar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">Em desenvolvimento: Vincule FAQs e tabelas de preços aqui.</p>
                </CardContent>
            </Card>
        </div>
    );
};
