import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/types';
import { KanbanCard } from './KanbanCard';
import { PipelineStage } from '@/types/pipeline';
import { pipelineService } from '@/services/pipelineService';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Trophy, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const PALETTE = [
    '#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#ef4444',
    '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
];

interface KanbanColumnProps {
    stage: PipelineStage;
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onOpenChat: (lead: Lead) => void;
    isDragging: boolean;
    onStageUpdate: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    stage, leads, onLeadClick, onOpenChat, isDragging, onStageUpdate
}) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });
    const [editOpen, setEditOpen] = useState(false);
    const [editName, setEditName] = useState(stage.name);
    const [editColor, setEditColor] = useState(stage.color);
    const [editIsWon, setEditIsWon] = useState(stage.is_won);
    const [editIsLost, setEditIsLost] = useState(stage.is_lost);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            await pipelineService.updateStage(stage.id, {
                name: editName,
                color: editColor,
                is_won: editIsWon,
                is_lost: editIsLost,
            });
            toast.success('Etapa atualizada');
            setEditOpen(false);
            onStageUpdate();
        } catch {
            toast.error('Erro ao atualizar etapa');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Remover etapa "${stage.name}"? Os leads não serão excluídos.`)) return;
        try {
            await pipelineService.deleteStage(stage.id);
            toast.success('Etapa removida');
            onStageUpdate();
        } catch {
            toast.error('Erro ao remover etapa');
        }
    };

    const headerIcon = stage.is_won ? '✅' : stage.is_lost ? '❌' : null;

    return (
        <div className="kanban-column bg-card shrink-0 w-72">
            {/* Column header */}
            <div
                className="kanban-column-header text-white flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${stage.color}ee, ${stage.color}bb)` }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse shrink-0" />
                    <h3 className="font-semibold truncate">
                        {headerIcon && <span className="mr-1">{headerIcon}</span>}
                        {stage.name}
                    </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold">
                        {leads.length}
                    </span>
                    {/* Edit stage popover */}
                    <Popover open={editOpen} onOpenChange={open => {
                        setEditOpen(open);
                        if (open) { setEditName(stage.name); setEditColor(stage.color); setEditIsWon(stage.is_won); setEditIsLost(stage.is_lost); }
                    }}>
                        <PopoverTrigger asChild>
                            <button className="p-1 rounded hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                <Pencil className="h-3 w-3" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-4" align="end">
                            <div className="space-y-3">
                                <p className="text-sm font-semibold">Editar Etapa</p>
                                <Input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Nome da etapa"
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    autoFocus
                                />
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Cor</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {PALETTE.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditColor(c)}
                                                className={cn('w-6 h-6 rounded-full transition-transform', editColor === c && 'ring-2 ring-offset-2 ring-foreground scale-110')}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={editIsWon} onCheckedChange={v => { setEditIsWon(v); if (v) setEditIsLost(false); }} id="sw-won" />
                                        <Label htmlFor="sw-won" className="text-xs">Etapa de ganho</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={editIsLost} onCheckedChange={v => { setEditIsLost(v); if (v) setEditIsWon(false); }} id="sw-lost" />
                                        <Label htmlFor="sw-lost" className="text-xs">Etapa de perda</Label>
                                    </div>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                                    </Button>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
                                        <Button size="sm" onClick={handleSave} disabled={isSaving}
                                            style={{ backgroundColor: editColor }}>
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Droppable body */}
            <div
                ref={setNodeRef}
                className={cn(
                    'kanban-column-body group',
                    isOver && isDragging && 'bg-primary/10 ring-2 ring-primary/30 ring-inset'
                )}
            >
                {leads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} onLeadClick={onLeadClick} onOpenChat={onOpenChat} />
                ))}
                {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium">Nenhum lead</span>
                        <span className="text-xs mt-1">Arraste leads para cá</span>
                    </div>
                )}
            </div>
        </div>
    );
};
