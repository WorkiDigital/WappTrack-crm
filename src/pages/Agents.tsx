import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Plus, Bot, Settings as SettingsIcon, Info, Layout, Copy } from 'lucide-react';
import { agentService } from '@/services/agentService';
import { AgentWithRelations } from '@/types/agent';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Import the real components
import { AgentBehaviorTab } from '@/components/agents/AgentBehaviorTab';
import { AgentStagesTab } from '@/components/agents/AgentStagesTab';
import { AgentConnectionsTab } from '@/components/agents/AgentConnectionsTab';
import { AgentKnowledgeTab } from '@/components/agents/AgentKnowledgeTab';
import { AgentKanbanTab } from '@/components/agents/AgentKanbanTab';

const Agents = () => {
    const [agents, setAgents] = useState<AgentWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentWithRelations | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');

    const fetchAgents = async () => {
        try {
            if (!selectedAgent) setIsLoading(true);
            const data = await agentService.getAgents();
            setAgents(data as AgentWithRelations[]);

            // Update selected agent if it exists
            if (selectedAgent) {
                const updated = data.find(a => a.id === selectedAgent.id);
                if (updated) setSelectedAgent(updated as AgentWithRelations);
            }
        } catch (error: any) {
            console.error('Error fetching agents:', error);
            toast.error(error?.message || 'Erro ao carregar agentes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleCreateAgent = async () => {
        if (!newAgentName) {
            toast.error('Nome do agente é obrigatório');
            return;
        }

        try {
            const { data: instances } = await supabase
                .from('whatsapp_instances')
                .select('id')
                .limit(1);

            const instanceId = instances && instances.length > 0 ? instances[0].id : null;

            const newAgent = await agentService.createAgent({
                name: newAgentName,
                instance_id: instanceId
            });

            toast.success('Agente criado com sucesso');
            setIsCreateDialogOpen(false);
            setNewAgentName('');

            const data = await agentService.getAgents();
            setAgents(data as AgentWithRelations[]);
            const fullAgent = data.find(a => a.id === newAgent.id);
            if (fullAgent) setSelectedAgent(fullAgent as AgentWithRelations);

        } catch (error: any) {
            console.error('Error creating agent:', error);
            toast.error(error?.message || 'Erro ao criar agente');
        }
    };

    const handleDuplicateAgent = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            toast.loading('Duplicando agente...');
            await agentService.duplicateAgent(id);
            toast.dismiss();
            toast.success('Agente duplicado com sucesso');
            fetchAgents();
        } catch (error: any) {
            toast.dismiss();
            console.error('Error duplicating agent:', error);
            toast.error(error?.message || 'Erro ao duplicar agente');
        }
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
                        <p className="text-muted-foreground">Gerencie seus agentes de atendimento automatizado.</p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Agente
                    </Button>
                </div>

                {isLoading && !selectedAgent ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse h-48 bg-muted/20" />
                        ))}
                    </div>
                ) : !selectedAgent && agents.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <Bot className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <CardTitle>Nenhum agente encontrado</CardTitle>
                        <CardDescription className="mt-2">
                            Comece criando seu primeiro agente para automatizar seus atendimentos.
                        </CardDescription>
                        <Button className="mt-6" onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Agente
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {!selectedAgent ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {agents.map((agent) => (
                                    <Card
                                        key={agent.id}
                                        className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                                        onClick={() => setSelectedAgent(agent)}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <Badge variant={agent.is_active ? "default" : "secondary"}>
                                                    {agent.is_active ? "Ativo" : "Inativo"}
                                                </Badge>
                                                <Bot className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <CardTitle className="mt-4">{agent.name}</CardTitle>
                                            <CardDescription className="flex items-center justify-between">
                                                <span>{agent.persona_name || "Assistente"}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => handleDuplicateAgent(e, agent.id)}
                                                    title="Duplicar Agente"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                                {agent.function || "Nenhuma função definida"}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" onClick={() => setSelectedAgent(null)}>
                                        &larr; Voltar
                                    </Button>
                                    <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                                </div>

                                <Tabs defaultValue="behavior" className="w-full">
                                    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4">
                                        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                                            <TabsTrigger value="behavior"><Bot className="mr-2 h-4 w-4" /> Comportamento</TabsTrigger>
                                            <TabsTrigger value="stages"><Layout className="mr-2 h-4 w-4" /> Etapas</TabsTrigger>
                                            <TabsTrigger value="connections"><SettingsIcon className="mr-2 h-4 w-4" /> Conexões</TabsTrigger>
                                            <TabsTrigger value="knowledge"><Info className="mr-2 h-4 w-4" /> Conhecimento</TabsTrigger>
                                            <TabsTrigger value="kanban"><Layout className="mr-2 h-4 w-4" /> Kanban</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <TabsContent value="behavior" className="mt-0">
                                        <AgentBehaviorTab agent={selectedAgent} onUpdate={fetchAgents} />
                                    </TabsContent>

                                    <TabsContent value="stages" className="mt-0">
                                        <AgentStagesTab agent={selectedAgent} onUpdate={fetchAgents} />
                                    </TabsContent>

                                    <TabsContent value="connections" className="mt-0">
                                        <AgentConnectionsTab agent={selectedAgent} onUpdate={fetchAgents} />
                                    </TabsContent>

                                    <TabsContent value="knowledge" className="mt-0">
                                        <AgentKnowledgeTab agent={selectedAgent} onUpdate={fetchAgents} />
                                    </TabsContent>

                                    <TabsContent value="kanban" className="mt-0">
                                        <AgentKanbanTab agent={selectedAgent} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Agente</DialogTitle>
                        <DialogDescription>
                            Dê um nome para o seu novo agente de IA.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome do Agente</Label>
                            <Input
                                id="name"
                                value={newAgentName}
                                onChange={(e) => setNewAgentName(e.target.value)}
                                placeholder="Ex: SDR Bryan"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateAgent}>Criar Agente</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
};

export default Agents;
