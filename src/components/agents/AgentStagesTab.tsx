import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Info, Target, CheckCircle, Database, MessageSquare } from 'lucide-react';
import { AgentWithRelations, AgentStageWithRelations, StageVariable, StageExample } from '@/types/agent';
import { agentService } from '@/services/agentService';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_STATUSES, getStatusLabel, FUNNEL_STATUSES } from '@/constants/funnelStatuses';

interface AgentStagesTabProps {
    agent: AgentWithRelations;
    onUpdate: () => void;
}

export const AgentStagesTab = ({ agent, onUpdate }: AgentStagesTabProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newStageName, setNewStageName] = useState('');
    const [newStageFunnelStatus, setNewStageFunnelStatus] = useState('new');
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [stageFormData, setStageFormData] = useState<{
        name: string;
        objective: string;
        success_criteria: string;
        funnel_status: string;
    }>({ name: '', objective: '', success_criteria: '', funnel_status: 'new' });

    // Local state for adding variables/examples
    const [newVar, setNewVar] = useState({ name: '', description: '', required: false });
    const [newExample, setNewExample] = useState({ user_input: '', agent_response: '' });

    // Limpar os campos quando o agente muda
    useEffect(() => {
        setIsAdding(false);
        setNewStageName('');
        setNewStageFunnelStatus('new');
        setEditingStageId(null);
        setStageFormData({ name: '', objective: '', success_criteria: '', funnel_status: 'new' });
        setNewVar({ name: '', description: '', required: false });
        setNewExample({ user_input: '', agent_response: '' });
    }, [agent.id]);

    const handleAddStage = async () => {
        if (!newStageName) return;
        try {
            const order = (agent.agent_stages?.length || 0) + 1;
            await agentService.createStage({
                agent_id: agent.id,
                name: newStageName,
                stage_order: order,
                is_active: true,
                funnel_status: newStageFunnelStatus
            });
            toast.success('Etapa adicionada');
            setNewStageName('');
            setIsAdding(false);
            onUpdate();
        } catch (error: any) {
            console.error('Error adding stage:', error);
            toast.error(error?.message || 'Erro ao adicionar etapa');
        }
    };

    const handleStartEdit = (stage: AgentStageWithRelations) => {
        setEditingStageId(stage.id);
        setStageFormData({
            name: stage.name,
            objective: stage.objective || '',
            success_criteria: stage.success_criteria || '',
            funnel_status: (stage as any).funnel_status || 'new'
        });
    };

    const handleSaveStage = async (id: string) => {
        try {
            await agentService.updateStage(id, stageFormData);
            toast.success('Etapa atualizada');
            setEditingStageId(null);
            onUpdate();
        } catch (error: any) {
            console.error('Error updating stage:', error);
            toast.error(error?.message || 'Erro ao atualizar etapa');
        }
    };

    const handleDeleteStage = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta etapa?')) return;
        try {
            await agentService.deleteStage(id);
            toast.success('Etapa removida');
            onUpdate();
        } catch (error: any) {
            console.error('Error deleting stage:', error);
            toast.error(error?.message || 'Erro ao remover etapa');
        }
    };

    // Variable Handlers
    const handleAddVariable = async (stageId: string) => {
        if (!newVar.name) return;
        try {
            await agentService.createVariable({
                stage_id: stageId,
                field_name: newVar.name,
                description: newVar.description,
                is_required: newVar.required
            });
            toast.success('Variável adicionada');
            setNewVar({ name: '', description: '', required: false });
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao adicionar variável');
        }
    };

    const handleDeleteVariable = async (id: string) => {
        try {
            await agentService.deleteVariable(id);
            toast.success('Variável removida');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao remover variável');
        }
    };

    // Example Handlers
    const handleAddExample = async (stageId: string) => {
        if (!newExample.agent_response) return;
        try {
            await agentService.createExample({
                stage_id: stageId,
                role: 'assistant',
                message: newExample.agent_response
            });

            toast.success('Exemplo adicionado');
            setNewExample({ user_input: '', agent_response: '' });
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao adicionar exemplo');
        }
    };

    const handleDeleteExample = async (id: string) => {
        try {
            await agentService.deleteExample(id);
            toast.success('Exemplo removido');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao remover exemplo');
        }
    };

    const sortedStages = [...(agent.agent_stages || [])].sort((a, b) => a.stage_order - b.stage_order);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle>Fluxo de Etapas</CardTitle>
                        <CardDescription>Defina a sequência e os objetivos do atendimento.</CardDescription>
                    </div>
                    <Button onClick={() => setIsAdding(true)} variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" /> Nova Etapa
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isAdding && (
                            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Nome da Etapa</Label>
                                        <Input
                                            value={newStageName}
                                            onChange={(e) => setNewStageName(e.target.value)}
                                            placeholder="Ex: Qualificação de Orçamento"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Status no Kanban</Label>
                                        <Select
                                            value={newStageFunnelStatus}
                                            onValueChange={setNewStageFunnelStatus}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ALL_STATUSES.map(status => (
                                                    <SelectItem key={status} value={status}>
                                                        {getStatusLabel(status)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button onClick={() => setIsAdding(false)} variant="ghost" size="sm">Cancelar</Button>
                                    <Button onClick={handleAddStage} size="sm">Adicionar</Button>
                                </div>
                            </div>
                        )}

                        {sortedStages.map((stage, index) => (
                            <Collapsible
                                key={stage.id}
                                open={editingStageId === stage.id}
                                onOpenChange={(open) => !open && setEditingStageId(null)}
                                className="group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between p-4 bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-none">{stage.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{stage.objective || "Sem objetivo definido"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => editingStageId === stage.id ? setEditingStageId(null) : handleStartEdit(stage)}
                                        >
                                            {editingStageId === stage.id ? "Recolher" : "Configurar"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteStage(stage.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CollapsibleContent className="border-t bg-muted/30 p-4 space-y-4">
                                    {editingStageId === stage.id && (
                                        <>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Nome da Etapa</Label>
                                                <Input
                                                    value={stageFormData.name}
                                                    onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                                                    placeholder="Ex: Qualificação"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Objetivo</Label>
                                                <Textarea
                                                    value={stageFormData.objective}
                                                    onChange={(e) => setStageFormData({ ...stageFormData, objective: e.target.value })}
                                                    placeholder="Ex: Qualificar o lead para saber se tem orçamento"
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Critério de Sucesso</Label>
                                                <Textarea
                                                    value={stageFormData.success_criteria}
                                                    onChange={(e) => setStageFormData({ ...stageFormData, success_criteria: e.target.value })}
                                                    placeholder="Ex: Lead confirmou que tem orçamento disponível"
                                                    className="min-h-[80px]"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-sm font-semibold">Status no Kanban</Label>
                                                <Select
                                                    value={stageFormData.funnel_status}
                                                    onValueChange={(value) => setStageFormData({ ...stageFormData, funnel_status: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ALL_STATUSES.map(status => (
                                                            <SelectItem key={status} value={status}>
                                                                {getStatusLabel(status)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button onClick={() => setEditingStageId(null)} variant="ghost" size="sm">Cancelar</Button>
                                                <Button onClick={() => handleSaveStage(stage.id)} size="sm">Salvar Etapa</Button>
                                            </div>

                                            <Separator className="my-4" />

                                            <div className="space-y-4">
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    <Database className="h-4 w-4" /> Variáveis da Etapa
                                                </h4>
                                                <div className="space-y-2">
                                                    {stage.stage_variables?.map((v) => (
                                                        <div key={v.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                                                            <div>
                                                                <p className="text-sm font-medium">{v.field_name}</p>
                                                                <p className="text-xs text-muted-foreground">{v.description}</p>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteVariable(v.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid gap-2 p-2 border rounded-md bg-muted/20">
                                                    <Input
                                                        placeholder="Nome da variável"
                                                        value={newVar.name}
                                                        onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                                                    />
                                                    <Input
                                                        placeholder="Descrição"
                                                        value={newVar.description}
                                                        onChange={(e) => setNewVar({ ...newVar, description: e.target.value })}
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox
                                                            checked={newVar.required}
                                                            onCheckedChange={(checked) => setNewVar({ ...newVar, required: checked as boolean })}
                                                        />
                                                        <Label className="text-sm">Obrigatória</Label>
                                                    </div>
                                                    <Button onClick={() => handleAddVariable(stage.id)} size="sm" className="w-full">
                                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Variável
                                                    </Button>
                                                </div>
                                            </div>

                                            <Separator className="my-4" />

                                            <div className="space-y-3">
                                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" /> Exemplo de Resposta da IA
                                                </h4>
                                                <div className="space-y-2">
                                                    {stage.stage_examples?.filter((ex: any) => ex.role === 'assistant').map((ex: any) => (
                                                        <div key={ex.id} className="p-2 border rounded-md bg-background">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm flex-1">{ex.message}</p>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExample(ex.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid gap-2 p-2 border rounded-md bg-muted/20">
                                                    <Textarea
                                                        placeholder="Exemplo de como a IA deve responder nesta etapa..."
                                                        value={newExample.agent_response}
                                                        onChange={(e) => setNewExample({ ...newExample, agent_response: e.target.value })}
                                                        className="min-h-[80px]"
                                                    />
                                                    <Button onClick={() => handleAddExample(stage.id)} size="sm" className="w-full">
                                                        <Plus className="h-4 w-4 mr-2" /> Adicionar Exemplo
                                                    </Button>
                                                </div>
                                            </div>

                                        </>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}

                        {sortedStages.length === 0 && !isAdding && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                                <p className="text-muted-foreground">Nenhuma etapa configurada. Comece adicionando uma!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
