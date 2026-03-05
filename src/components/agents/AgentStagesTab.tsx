import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Info, Target, CheckCircle, Database, MessageSquare, Zap, Send } from 'lucide-react';
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
import { usePipelines } from '@/hooks/usePipelines';

interface AgentStagesTabProps {
    agent: AgentWithRelations;
    onUpdate: () => void;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Texto livre' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'number', label: 'Número' },
    { value: 'date', label: 'Data' },
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' },
];

export const AgentStagesTab = ({ agent, onUpdate }: AgentStagesTabProps) => {
    const { pipelines } = usePipelines();
    const allPipelineStages = pipelines.flatMap(p => (p.stages || []).map(s => ({ ...s, pipelineName: p.name, pipelineColor: p.color })));

    const [isAdding, setIsAdding] = useState(false);
    const [newStageName, setNewStageName] = useState('');
    const [newStagePipelineStageId, setNewStagePipelineStageId] = useState('');
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [stageFormData, setStageFormData] = useState<{
        name: string;
        objective: string;
        success_criteria: string;
        funnel_status: string;
        ia_context: string;
        pipeline_stage_id: string;
    }>({ name: '', objective: '', success_criteria: '', funnel_status: 'new', ia_context: '', pipeline_stage_id: '' });

    // Local state for adding variables/examples
    const [newVar, setNewVar] = useState({ name: '', description: '', required: false, field_type: 'text' });
    const [newExample, setNewExample] = useState({ agent_response: '' });
    const [newOpeningMsg, setNewOpeningMsg] = useState('');

    // Limpar os campos quando o agente muda
    useEffect(() => {
        setIsAdding(false);
        setNewStageName('');
        setNewStagePipelineStageId('');
        setEditingStageId(null);
        setStageFormData({ name: '', objective: '', success_criteria: '', funnel_status: 'new', ia_context: '', pipeline_stage_id: '' });
        setNewVar({ name: '', description: '', required: false, field_type: 'text' });
        setNewExample({ agent_response: '' });
        setNewOpeningMsg('');
    }, [agent.id]);

    const handleAddStage = async () => {
        if (!newStageName) return;
        try {
            const order = (agent.agent_stages?.length || 0) + 1;
            const selectedPs = allPipelineStages.find(s => s.id === newStagePipelineStageId);
            await agentService.createStage({
                agent_id: agent.id,
                name: newStageName,
                stage_order: order,
                is_active: true,
                funnel_status: selectedPs?.maps_to_status || '',
                pipeline_stage_id: newStagePipelineStageId || null,
            } as any);
            toast.success('Etapa adicionada');
            setNewStageName('');
            setNewStagePipelineStageId('');
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
            funnel_status: (stage as any).funnel_status || 'new',
            ia_context: (stage as any).ia_context || '',
            pipeline_stage_id: (stage as any).pipeline_stage_id || '',
        });
    };

    const handleSaveStage = async (id: string) => {
        try {
            const selectedPs = allPipelineStages.find(s => s.id === stageFormData.pipeline_stage_id);
            const payload = {
                ...stageFormData,
                funnel_status: selectedPs?.maps_to_status || stageFormData.funnel_status,
                pipeline_stage_id: stageFormData.pipeline_stage_id || null,
            };
            await agentService.updateStage(id, payload as any);
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
                is_required: newVar.required,
                field_type: newVar.field_type
            });
            toast.success('Variável adicionada');
            setNewVar({ name: '', description: '', required: false, field_type: 'text' });
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
            setNewExample({ agent_response: '' });
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao adicionar exemplo');
        }
    };

    const handleAddOpeningMsg = async (stageId: string) => {
        if (!newOpeningMsg) return;
        try {
            // Remove existing opening message first
            const stage = (agent.agent_stages || []).find(s => s.id === stageId);
            const existing = (stage?.stage_examples as any[])?.find((ex: any) => ex.role === 'opening');
            if (existing) await agentService.deleteExample(existing.id);

            await agentService.createExample({
                stage_id: stageId,
                role: 'opening',
                message: newOpeningMsg
            });
            toast.success('Mensagem de abertura salva');
            setNewOpeningMsg('');
            onUpdate();
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao salvar mensagem de abertura');
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

    const getFieldTypeLabel = (type: string | null) => {
        return FIELD_TYPES.find(f => f.value === type)?.label || 'Texto livre';
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
                                        <Label className="text-xs font-semibold">Etapa do Pipeline</Label>
                                        <Select value={newStagePipelineStageId} onValueChange={setNewStagePipelineStageId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pipelines.map(p => (
                                                    <React.Fragment key={p.id}>
                                                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">{p.name}</div>
                                                        {(p.stages || []).map(s => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                                    {s.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </React.Fragment>
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

                        {sortedStages.map((stage, index) => {
                            const openingMsg = (stage.stage_examples as any[])?.find((ex: any) => ex.role === 'opening');
                            return (
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
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{stage.objective || "Sem objetivo definido"}</p>
                                                    {openingMsg && (
                                                        <Badge variant="secondary" className="text-xs py-0 h-4">
                                                            <Send className="h-2.5 w-2.5 mr-1" /> Abertura
                                                        </Badge>
                                                    )}
                                                    {(stage as any).ia_context && (
                                                        <Badge variant="outline" className="text-xs py-0 h-4 border-blue-300 text-blue-600">
                                                            <Zap className="h-2.5 w-2.5 mr-1" /> Instruções IA
                                                        </Badge>
                                                    )}
                                                </div>
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
                                                    <Label className="text-sm font-semibold">Etapa do Pipeline</Label>
                                                    <Select
                                                        value={stageFormData.pipeline_stage_id}
                                                        onValueChange={(value) => setStageFormData({ ...stageFormData, pipeline_stage_id: value })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {pipelines.map(p => (
                                                                <React.Fragment key={p.id}>
                                                                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">{p.name}</div>
                                                                    {(p.stages || []).map(s => (
                                                                        <SelectItem key={s.id} value={s.id}>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                                                {s.name}
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </React.Fragment>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-sm font-semibold flex items-center gap-2">
                                                        <Zap className="h-4 w-4 text-blue-500" /> Instruções Extras para a IA
                                                        <span className="text-xs text-muted-foreground font-normal">(contexto específico desta etapa)</span>
                                                    </Label>
                                                    <Textarea
                                                        value={stageFormData.ia_context}
                                                        onChange={(e) => setStageFormData({ ...stageFormData, ia_context: e.target.value })}
                                                        placeholder="Ex: Se o lead mencionar concorrentes, ressalte nossos diferenciais. Não mencione preços ainda."
                                                        className="min-h-[80px] border-blue-200 focus-visible:ring-blue-400"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button onClick={() => setEditingStageId(null)} variant="ghost" size="sm">Cancelar</Button>
                                                    <Button onClick={() => handleSaveStage(stage.id)} size="sm">Salvar Etapa</Button>
                                                </div>

                                                <Separator className="my-4" />

                                                {/* Opening Message Section */}
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                        <Send className="h-4 w-4 text-green-500" /> Mensagem de Abertura
                                                        <span className="text-xs text-muted-foreground font-normal">(enviada automaticamente ao entrar nesta etapa)</span>
                                                    </h4>
                                                    {openingMsg ? (
                                                        <div className="flex items-start justify-between p-3 border rounded-md bg-green-50/50 border-green-200">
                                                            <p className="text-sm flex-1 text-green-800">{openingMsg.message}</p>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive ml-2 shrink-0" onClick={() => handleDeleteExample(openingMsg.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-2 p-3 border rounded-md bg-muted/20 border-dashed border-green-300">
                                                            <Textarea
                                                                placeholder="Ex: Olá! Agora vou te apresentar nossa solução personalizada. Pode me contar um pouco mais sobre sua empresa?"
                                                                value={newOpeningMsg}
                                                                onChange={(e) => setNewOpeningMsg(e.target.value)}
                                                                className="min-h-[80px] border-green-200 focus-visible:ring-green-400"
                                                            />
                                                            <Button onClick={() => handleAddOpeningMsg(stage.id)} size="sm" variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                                                                <Send className="h-4 w-4 mr-2" /> Salvar Mensagem de Abertura
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                <Separator className="my-4" />

                                                <div className="space-y-4">
                                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                                        <Database className="h-4 w-4" /> Variáveis da Etapa
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {stage.stage_variables?.map((v) => (
                                                            <div key={v.id} className="flex items-center justify-between p-2 border rounded-md bg-background">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <div>
                                                                        <p className="text-sm font-medium">{v.field_name}</p>
                                                                        <p className="text-xs text-muted-foreground">{v.description}</p>
                                                                    </div>
                                                                    {(v as any).field_type && (v as any).field_type !== 'text' && (
                                                                        <Badge variant="outline" className="text-xs h-5">
                                                                            {getFieldTypeLabel((v as any).field_type)}
                                                                        </Badge>
                                                                    )}
                                                                    {v.is_required && (
                                                                        <Badge variant="destructive" className="text-xs h-5">Obrigatório</Badge>
                                                                    )}
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteVariable(v.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="grid gap-2 p-2 border rounded-md bg-muted/20">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Input
                                                                placeholder="Nome da variável (ex: nome_empresa)"
                                                                value={newVar.name}
                                                                onChange={(e) => setNewVar({ ...newVar, name: e.target.value })}
                                                            />
                                                            <Select
                                                                value={newVar.field_type}
                                                                onValueChange={(value) => setNewVar({ ...newVar, field_type: value })}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Tipo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {FIELD_TYPES.map(ft => (
                                                                        <SelectItem key={ft.value} value={ft.value}>
                                                                            {ft.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Input
                                                            placeholder="Descrição (ex: Nome completo da empresa do lead)"
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
                                                        <MessageSquare className="h-4 w-4" /> Exemplos de Resposta da IA
                                                        <span className="text-xs text-muted-foreground font-normal">(tom e estilo esperados)</span>
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {(stage.stage_examples as any[])?.filter((ex: any) => ex.role === 'assistant').map((ex: any) => (
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
                            );
                        })}

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
