import React, { useState } from 'react';
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

    const handleAddStage = async () => {
        if (!newStageName) return;
        try {
            const order = (agent.stages?.length || 0) + 1;
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
        if (!newExample.user_input || !newExample.agent_response) return;
        try {
            await agentService.createExample({
                stage_id: stageId,
                role: 'user',
                message: newExample.user_input
            });
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

    const sortedStages = [...(agent.stages || [])].sort((a, b) => a.stage_order - b.stage_order);

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
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleDeleteStage(stage.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="p-6 border-t bg-muted/20 space-y-6 animate-in slide-in-from-top-2">
                                        {/* Basic Info */}
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label className="flex items-center gap-2 italic"><Target className="h-3 w-3" /> Nome da Etapa</Label>
                                                <Input
                                                    value={stageFormData.name}
                                                    onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="flex items-center gap-2 italic"><Info className="h-3 w-3" /> Objetivo</Label>
                                                <Input
                                                    value={stageFormData.objective}
                                                    onChange={(e) => setStageFormData({ ...stageFormData, objective: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="flex items-center gap-2 italic"><Target className="h-3 w-3" /> Status no Kanban</Label>
                                                <Select
                                                    value={stageFormData.funnel_status}
                                                    onValueChange={(v) => setStageFormData({ ...stageFormData, funnel_status: v })}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Selecione o status..." />
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

                                        <div className="grid gap-2">
                                            <Label className="flex items-center gap-2 italic"><CheckCircle className="h-3 w-3" /> Critérios de Sucesso (para avançar)</Label>
                                            <Textarea
                                                value={stageFormData.success_criteria}
                                                onChange={(e) => setStageFormData({ ...stageFormData, success_criteria: e.target.value })}
                                                placeholder="Ex: O lead informou o nome e o interesse principal."
                                                className="min-h-[60px]"
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <Button size="sm" onClick={() => handleSaveStage(stage.id)}><Save className="mr-2 h-4 w-4" /> Salvar Configurações Básicas</Button>
                                        </div>

                                        <Separator />

                                        {/* Variables Management */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                                    <Database className="h-4 w-4" /> Variáveis para Coletar
                                                </h4>
                                            </div>
                                            <div className="grid gap-3">
                                                {stage.stage_variables?.map(v => (
                                                    <div key={v.id} className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">{v.field_name || (v as any).name}</span>
                                                                {(v.is_required || (v as any).required) && <Badge variant="secondary" className="text-[10px]">Obrigatório</Badge>}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{v.description}</p>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteVariable(v.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <div className="grid gap-3 p-4 border border-dashed rounded-lg bg-background/50">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Input
                                                            placeholder="Nome (ex: nome_completo)"
                                                            value={newVar.name}
                                                            onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                        <Input
                                                            placeholder="Descrição (ex: Nome do lead)"
                                                            value={newVar.description}
                                                            onChange={(e) => setNewVar({ ...newVar, description: e.target.value })}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`req-${stage.id}`}
                                                                checked={newVar.required}
                                                                onCheckedChange={(checked) => setNewVar({ ...newVar, required: !!checked })}
                                                            />
                                                            <Label htmlFor={`req-${stage.id}`} className="text-xs">Obrigatório para avançar</Label>
                                                        </div>
                                                        <Button size="sm" variant="outline" className="h-8" onClick={() => handleAddVariable(stage.id)}>
                                                            <Plus className="mr-1 h-3 w-3" /> Adicionar Variável
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Examples Management */}
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                                <MessageSquare className="h-4 w-4" /> Exemplos de Interação (Few-shot)
                                            </h4>
                                            <div className="grid gap-4">
                                                {stage.stage_examples?.map((ex, idx) => (
                                                    <div key={ex.id} className="space-y-2 p-3 bg-background rounded-lg border shadow-sm">
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex gap-2">
                                                                    <Badge variant={ex.role === 'user' ? "outline" : "default"} className="h-fit">
                                                                        {ex.role === 'user' ? "Lead" : "Agente"}
                                                                    </Badge>
                                                                    <p className="text-sm italic">"{ex.message}"</p>
                                                                </div>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteExample(ex.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="grid gap-3 p-4 border border-dashed rounded-lg bg-background/50">
                                                    <Textarea
                                                        placeholder="Input do usuário..."
                                                        value={newExample.user_input}
                                                        onChange={(e) => setNewExample({ ...newExample, user_input: e.target.value })}
                                                        className="text-sm min-h-[60px]"
                                                    />
                                                    <Textarea
                                                        placeholder="Resposta ideal do agente..."
                                                        value={newExample.agent_response}
                                                        onChange={(e) => setNewExample({ ...newExample, agent_response: e.target.value })}
                                                        className="text-sm min-h-[60px]"
                                                    />
                                                    <Button size="sm" variant="outline" className="w-fit ml-auto" onClick={() => handleAddExample(stage.id)}>
                                                        <Plus className="mr-1 h-3 w-3" /> Adicionar Exemplo
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}

                        {sortedStages.length === 0 && !isAdding && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                                <p className="text-muted-foreground">Nenhuma etapa configurada.</p>
                                <Button variant="link" onClick={() => setIsAdding(true)}>Comece adicionando a primeira etapa</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
