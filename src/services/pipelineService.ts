import { supabase } from '@/integrations/supabase/client';
import { Pipeline, PipelineStage, PipelineInsert, PipelineStageInsert } from '@/types/pipeline';

const DEFAULT_STAGES = [
    { name: 'Novo', color: '#3b82f6', stage_order: 0, is_won: false, is_lost: false, maps_to_status: 'new' },
    { name: 'Contatado', color: '#06b6d4', stage_order: 1, is_won: false, is_lost: false, maps_to_status: 'contacted' },
    { name: 'Qualificado', color: '#8b5cf6', stage_order: 2, is_won: false, is_lost: false, maps_to_status: 'qualified' },
    { name: 'Ganho', color: '#10b981', stage_order: 3, is_won: true, is_lost: false, maps_to_status: 'converted' },
    { name: 'Perdido', color: '#ef4444', stage_order: 4, is_won: false, is_lost: true, maps_to_status: 'lost' },
];

export const pipelineService = {
    async getPipelines(): Promise<Pipeline[]> {
        const { data, error } = await supabase
            .from('pipelines' as any)
            .select(`*, stages:pipeline_stages(*)`)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return ((data || []) as any[]).map((p: any) => ({
            ...p,
            stages: (p.stages || []).sort((a: PipelineStage, b: PipelineStage) => a.stage_order - b.stage_order)
        }));
    },

    async createPipeline(data: PipelineInsert, withDefaultStages = true): Promise<Pipeline> {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: created, error } = await supabase
            .from('pipelines' as any)
            .insert({ ...data, user_id: user?.id })
            .select()
            .single();
        if (error) throw error;
        const pipeline = created as any as Pipeline;

        if (withDefaultStages) {
            await supabase
                .from('pipeline_stages' as any)
                .insert(DEFAULT_STAGES.map(s => ({ ...s, pipeline_id: pipeline.id })));
        }
        return pipeline;
    },

    async updatePipeline(id: string, data: Partial<PipelineInsert>): Promise<void> {
        const { error } = await supabase
            .from('pipelines' as any)
            .update(data)
            .eq('id', id);
        if (error) throw error;
    },

    async deletePipeline(id: string): Promise<void> {
        const { error } = await supabase
            .from('pipelines' as any)
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async createStage(data: PipelineStageInsert): Promise<PipelineStage> {
        const { data: created, error } = await supabase
            .from('pipeline_stages' as any)
            .insert(data)
            .select()
            .single();
        if (error) throw error;
        return created as any as PipelineStage;
    },

    async updateStage(id: string, data: Partial<PipelineStageInsert>): Promise<void> {
        const { error } = await supabase
            .from('pipeline_stages' as any)
            .update(data)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteStage(id: string): Promise<void> {
        const { error } = await supabase
            .from('pipeline_stages' as any)
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async reorderStages(stages: { id: string; stage_order: number }[]): Promise<void> {
        await Promise.all(
            stages.map(({ id, stage_order }) =>
                supabase.from('pipeline_stages' as any).update({ stage_order }).eq('id', id)
            )
        );
    },

    async setDefault(pipelineId: string): Promise<void> {
        await supabase.from('pipelines' as any).update({ is_default: false }).neq('id', pipelineId);
        await supabase.from('pipelines' as any).update({ is_default: true }).eq('id', pipelineId);
    },

    // Move a lead to a stage (updates both pipeline_stage_id and status for backward compat)
    async moveLeadToStage(leadId: string, stage: PipelineStage): Promise<void> {
        const { error } = await supabase
            .from('leads')
            .update({
                pipeline_stage_id: stage.id,
                pipeline_id: stage.pipeline_id,
                status: stage.maps_to_status,
            } as any)
            .eq('id', leadId);
        if (error) throw error;
    },
};
