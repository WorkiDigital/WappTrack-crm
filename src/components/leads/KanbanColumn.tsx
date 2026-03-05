import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Lead } from '@/types';
import { KanbanCard } from './KanbanCard';
import { PipelineStage } from '@/types/pipeline';
import { pipelineService } from '@/services/pipelineService';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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

    const wonLostLabel = stage.is_won ? ' · Ganho' : stage.is_lost ? ' · Perdido' : '';

    return (
        <div className="shrink-0 w-80 flex flex-col rounded-xl bg-card border border-border/60 shadow-sm overflow-hidden">
            {/* ── Column header ─────────────────────────────────── */}
            <div className="px-4 pt-4 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-semibold text-sm truncate">{stage.name}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium text-muted-foreground flex-shrink-0">
                            {leads.length}
                        </span>
                    </div>

                    {/* "..." menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => {
                                setEditName(stage.name);
                                setEditColor(stage.color);
                                setEditIsWon(stage.is_won);
                                setEditIsLost(stage.is_lost);
                                setEditOpen(true);
                            }}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Editar etapa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Remover etapa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Subtitle: lead count + won/lost label */}
                <p className="text-xs text-muted-foreground mt-1.5 pl-5.5">
                    {leads.length} lead{leads.length !== 1 ? 's' : ''}{wonLostLabel}
                </p>
            </div>

            <div className="border-t border-border/50" />

            {/* ── Droppable body ────────────────────────────────── */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 p-3 space-y-3 min-h-[520px] transition-colors duration-200',
                    isOver && isDragging && 'bg-primary/5 ring-2 ring-primary/20 ring-inset'
                )}
            >
                {leads.map(lead => (
                    <KanbanCard key={lead.id} lead={lead} onLeadClick={onLeadClick} onOpenChat={onOpenChat} />
                ))}
                {leads.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/60">
                        <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium">Nenhum lead</span>
                        <span className="text-xs mt-0.5">Arraste leads para cá</span>
                    </div>
                )}
            </div>

            {/* Edit stage dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar Etapa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-1">
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
                        <div className="flex justify-between gap-2 pt-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} style={{ backgroundColor: editColor }}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
