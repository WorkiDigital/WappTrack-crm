import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { AgentWithRelations } from '@/types/agent';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';

interface AgentKanbanTabProps {
    agent: AgentWithRelations;
}

export const AgentKanbanTab = ({ agent }: AgentKanbanTabProps) => {
    const [leadsByStage, setLeadsByStage] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('agent_id', agent.id);

            if (error) throw error;

            const grouped = (data || []).reduce((acc: any, lead) => {
                const stageId = lead.current_stage_id || 'unassigned';
                if (!acc[stageId]) acc[stageId] = [];
                acc[stageId].push(lead);
                return acc;
            }, {});

            setLeadsByStage(grouped);
        } catch (error) {
            console.error('Error fetching leads for kanban:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, [agent.id]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const leadId = active.id as string;
        const newStageId = over.id as string;

        // Find lead
        let targetLead = null;
        Object.values(leadsByStage).forEach(leads => {
            const found = leads.find(l => l.id === leadId);
            if (found) targetLead = found;
        });

        if (!targetLead || (targetLead as any).current_stage_id === newStageId) return;

        try {
            const { error } = await supabase
                .from('leads')
                .update({ current_stage_id: newStageId })
                .eq('id', leadId);

            if (error) throw error;
            toast.success('Lead movido de etapa');
            fetchLeads();
        } catch (error) {
            toast.error('Erro ao mover lead');
        }
    };

    const stages = [...(agent.stages || [])].sort((a, b) => a.stage_order - b.stage_order);

    return (
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex h-[calc(100vh-350px)] gap-4 overflow-x-auto pb-4">
                {stages.map((stage) => (
                    <div key={stage.id} className="flex flex-col w-80 shrink-0 gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    {stage.name}
                                    <Badge variant="secondary" className="rounded-full px-2 py-0">
                                        {leadsByStage[stage.id]?.length || 0}
                                    </Badge>
                                </h3>
                                {(stage as any).funnel_status && (
                                    <span className="text-[10px] text-muted-foreground uppercase font-semibold italic">
                                        Status: {(stage as any).funnel_status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ScrollArea id={stage.id} className="flex-1 rounded-lg bg-muted/30 p-2">
                            <div className="flex flex-col gap-3">
                                {leadsByStage[stage.id]?.map((lead) => (
                                    <Card key={lead.id} id={lead.id} className="shadow-sm hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer bg-card">
                                        <CardHeader className="p-3 pb-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={lead.profile_picture_url} />
                                                    <AvatarFallback>{lead.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-semibold truncate flex-1">{lead.name}</span>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-0">
                                            <p className="text-[10px] text-muted-foreground truncate">{lead.phone}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {Object.keys(lead.collected_variables || {}).slice(0, 3).map(key => (
                                                    <Badge key={key} variant="outline" className="text-[8px] h-4 px-1 bg-background/50">
                                                        {key}: {String((lead.collected_variables as any)[key])}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {(!leadsByStage[stage.id] || leadsByStage[stage.id].length === 0) && (
                                    <div className="text-center py-10 opacity-30">
                                        <p className="text-xs">Vazio</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                ))}
            </div>
        </DndContext>
    );
};
