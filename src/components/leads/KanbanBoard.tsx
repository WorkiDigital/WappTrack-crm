import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { Lead } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { pipelineService } from '@/services/pipelineService';
import { usePipelines } from '@/hooks/usePipelines';
import { Pipeline, PipelineStage } from '@/types/pipeline';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Loader2, GitBranch, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const PALETTE = [
    '#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444',
    '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
];

interface KanbanBoardProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onOpenChat: (lead: Lead) => void;
    onLeadUpdate: () => void;
    onAddLead?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    leads, onLeadClick, onOpenChat, onLeadUpdate, onAddLead
}) => {
    const { pipelines, activePipeline, setActivePipeline, isLoading, reload, addStage, deletePipeline } = usePipelines();
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    // Create pipeline dialog
    const [showCreatePipeline, setShowCreatePipeline] = useState(false);
    const [newPipelineName, setNewPipelineName] = useState('');
    const [newPipelineColor, setNewPipelineColor] = useState('#6366f1');
    const [isCreating, setIsCreating] = useState(false);

    // Add stage popover
    const [showAddStage, setShowAddStage] = useState(false);
    const [newStageName, setNewStageName] = useState('');
    const [newStageColor, setNewStageColor] = useState('#6366f1');
    const [isAddingStage, setIsAddingStage] = useState(false);

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null;
    const stages = activePipeline?.stages || [];

    const getLeadsByStage = (stage: PipelineStage) => {
        return leads.filter(lead => {
            if ((lead as any).pipeline_stage_id) return (lead as any).pipeline_stage_id === stage.id;
            return lead.status === stage.maps_to_status;
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setIsDragging(true);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setIsDragging(false);
        if (!over || !activePipeline) return;

        const leadId = active.id as string;
        const stageId = over.id as string;
        const stage = stages.find(s => s.id === stageId);
        if (!stage) return;

        const lead = leads.find(l => l.id === leadId);
        if (!lead || (lead as any).pipeline_stage_id === stageId) return;

        try {
            await pipelineService.moveLeadToStage(leadId, stage);
            toast.success(`Lead movido para "${stage.name}"`);
            onLeadUpdate();
        } catch {
            toast.error('Erro ao mover lead');
        }
    };

    const handleCreatePipeline = async () => {
        if (!newPipelineName.trim()) return;
        setIsCreating(true);
        try {
            await pipelineService.createPipeline({ name: newPipelineName, color: newPipelineColor });
            toast.success(`Pipeline "${newPipelineName}" criado`);
            setShowCreatePipeline(false);
            setNewPipelineName('');
            await reload();
        } catch {
            toast.error('Erro ao criar pipeline');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddStage = async () => {
        if (!newStageName.trim() || !activePipeline) return;
        setIsAddingStage(true);
        try {
            await addStage(activePipeline.id, newStageName, newStageColor);
            setNewStageName('');
            setNewStageColor('#6366f1');
            setShowAddStage(false);
            toast.success('Etapa adicionada');
        } finally {
            setIsAddingStage(false);
        }
    };

    const handleDeletePipeline = async () => {
        if (!activePipeline) return;
        if (!confirm(`Tem certeza que deseja excluir o pipeline "${activePipeline.name}"?`)) return;
        await deletePipeline(activePipeline.id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (pipelines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed rounded-xl bg-muted/10">
                <GitBranch className="h-10 w-10 text-muted-foreground/40" />
                <div className="text-center">
                    <p className="font-semibold text-foreground">Nenhum pipeline criado</p>
                    <p className="text-sm text-muted-foreground">Crie um pipeline para organizar seus leads em etapas</p>
                </div>
                <Button onClick={() => setShowCreatePipeline(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Pipeline
                </Button>
                <CreatePipelineDialog
                    open={showCreatePipeline}
                    onOpenChange={setShowCreatePipeline}
                    name={newPipelineName}
                    onNameChange={setNewPipelineName}
                    color={newPipelineColor}
                    onColorChange={setNewPipelineColor}
                    onConfirm={handleCreatePipeline}
                    isLoading={isCreating}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── Header ───────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold tracking-tight">Pipeline de Vendas</h2>
                        {/* Pipeline dropdown */}
                        <div className="flex items-center gap-1">
                            <Select
                                value={activePipeline?.id || ''}
                                onValueChange={(id) => {
                                    const p = pipelines.find(p => p.id === id);
                                    if (p) setActivePipeline(p);
                                }}
                            >
                                <SelectTrigger
                                    className="h-8 text-sm font-medium border-2 min-w-[130px]"
                                    style={{ borderColor: activePipeline?.color || '#6366f1' }}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pipelines.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                                {p.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                    <div className="border-t mt-1 pt-1">
                                        <button
                                            className="w-full text-left text-xs px-2 py-1.5 text-primary hover:bg-muted rounded flex items-center gap-2"
                                            onClick={(e) => { e.stopPropagation(); setShowCreatePipeline(true); }}
                                        >
                                            <Plus className="h-3 w-3" /> Novo Pipeline
                                        </button>
                                    </div>
                                </SelectContent>
                            </Select>
                            {activePipeline && (
                                <button
                                    onClick={handleDeletePipeline}
                                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Excluir pipeline"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Arraste os negócios entre os estágios</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    <Popover open={showAddStage} onOpenChange={setShowAddStage}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Plus className="h-4 w-4 mr-1.5" /> Novo Estágio
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4" align="end">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold">Nova Etapa</p>
                                <Input
                                    placeholder="Nome da etapa"
                                    value={newStageName}
                                    onChange={e => setNewStageName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddStage()}
                                    autoFocus
                                />
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Cor</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PALETTE.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setNewStageColor(c)}
                                                className={cn('w-6 h-6 rounded-full transition-transform', newStageColor === c && 'ring-2 ring-offset-2 ring-foreground scale-110')}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button size="sm" className="w-full" onClick={handleAddStage} disabled={isAddingStage || !newStageName.trim()}>
                                    {isAddingStage ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                    Adicionar
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {onAddLead && (
                        <Button
                            size="sm"
                            className="h-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={onAddLead}
                        >
                            <Plus className="h-4 w-4 mr-1.5" /> Novo Lead
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Kanban columns ───────────────────────────────────── */}
            <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
                    {stages.map(stage => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            leads={getLeadsByStage(stage)}
                            onLeadClick={onLeadClick}
                            onOpenChat={onOpenChat}
                            isDragging={isDragging}
                            onStageUpdate={reload}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeLead ? (
                        <div className="rotate-3 opacity-80">
                            <KanbanCard lead={activeLead} onLeadClick={() => {}} onOpenChat={() => {}} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <CreatePipelineDialog
                open={showCreatePipeline}
                onOpenChange={setShowCreatePipeline}
                name={newPipelineName}
                onNameChange={setNewPipelineName}
                color={newPipelineColor}
                onColorChange={setNewPipelineColor}
                onConfirm={handleCreatePipeline}
                isLoading={isCreating}
            />
        </div>
    );
};

// ── Create Pipeline Dialog ──────────────────────────────────────────────────
function CreatePipelineDialog({ open, onOpenChange, name, onNameChange, color, onColorChange, onConfirm, isLoading }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    name: string;
    onNameChange: (v: string) => void;
    color: string;
    onColorChange: (v: string) => void;
    onConfirm: () => void;
    isLoading: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Novo Pipeline</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label>Nome do Pipeline</Label>
                        <Input
                            placeholder="Ex: Vendas, Suporte, Pós-venda"
                            value={name}
                            onChange={e => onNameChange(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onConfirm()}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm text-muted-foreground">Cor de identificação</Label>
                        <div className="flex flex-wrap gap-2">
                            {PALETTE.map(c => (
                                <button
                                    key={c}
                                    onClick={() => onColorChange(c)}
                                    className={cn('w-7 h-7 rounded-full transition-transform', color === c && 'ring-2 ring-offset-2 ring-foreground scale-110')}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">O pipeline será criado com as etapas padrão (Novo, Contatado, Qualificado, Ganho, Perdido). Você pode editá-las depois.</p>
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={onConfirm} disabled={isLoading || !name.trim()} style={{ backgroundColor: color }}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Criar Pipeline
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
