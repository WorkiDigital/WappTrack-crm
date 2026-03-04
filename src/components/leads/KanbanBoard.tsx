import React from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { Lead } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ACTIVE_FUNNEL_STATUSES, FINAL_STATUSES, FunnelStatus } from '@/constants/funnelStatuses';
import { updateLead } from '@/services/dataService';
import { toast } from 'sonner';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onOpenChat: (lead: Lead) => void;
  onLeadUpdate: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onLeadClick,
  onOpenChat,
  onLeadUpdate
}) => {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const activeLead = activeId ? leads.find(lead => lead.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as FunnelStatus;
    const lead = leads.find(l => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    try {
      await updateLead(leadId, { status: newStatus });
      toast.success(`Lead movido para "${newStatus}"`);
      onLeadUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do lead');
    }
  };

  const getLeadsByStatus = (status: FunnelStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  const allStatuses: FunnelStatus[] = [...ACTIVE_FUNNEL_STATUSES, ...FINAL_STATUSES];

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {allStatuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            leads={getLeadsByStatus(status)}
            onLeadClick={onLeadClick}
            onOpenChat={onOpenChat}
            isDragging={isDragging}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 opacity-80">
            <KanbanCard
              lead={activeLead}
              onLeadClick={() => {}}
              onOpenChat={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
