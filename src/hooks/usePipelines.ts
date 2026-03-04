import { useState, useEffect, useCallback } from 'react';
import { Pipeline, PipelineStage } from '@/types/pipeline';
import { pipelineService } from '@/services/pipelineService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function usePipelines() {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const data = await pipelineService.getPipelines();
            setPipelines(data);
            // Keep active pipeline in sync after reload
            setActivePipeline(prev => {
                if (!prev) return data.find(p => p.is_default) || data[0] || null;
                return data.find(p => p.id === prev.id) || data[0] || null;
            });
        } catch (e) {
            console.error('Error loading pipelines:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        // Real-time subscription
        const channel = supabase
            .channel('pipelines-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pipelines' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_stages' }, load)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [load]);

    const createPipeline = async (name: string, color: string) => {
        try {
            const created = await pipelineService.createPipeline({ name, color });
            toast.success(`Pipeline "${name}" criado`);
            await load();
            setActivePipeline(pipelines.find(p => p.id === created.id) || null);
        } catch {
            toast.error('Erro ao criar pipeline');
        }
    };

    const renamePipeline = async (id: string, name: string) => {
        try {
            await pipelineService.updatePipeline(id, { name });
            await load();
        } catch {
            toast.error('Erro ao renomear pipeline');
        }
    };

    const deletePipeline = async (id: string) => {
        try {
            await pipelineService.deletePipeline(id);
            toast.success('Pipeline removido');
            await load();
        } catch {
            toast.error('Erro ao remover pipeline');
        }
    };

    const addStage = async (pipelineId: string, name: string, color: string) => {
        try {
            const pipeline = pipelines.find(p => p.id === pipelineId);
            const maxOrder = Math.max(-1, ...(pipeline?.stages || []).map(s => s.stage_order));
            await pipelineService.createStage({ pipeline_id: pipelineId, name, color, stage_order: maxOrder + 1 });
            await load();
        } catch {
            toast.error('Erro ao adicionar etapa');
        }
    };

    const updateStage = async (id: string, updates: Partial<PipelineStage>) => {
        try {
            await pipelineService.updateStage(id, updates as any);
            await load();
        } catch {
            toast.error('Erro ao atualizar etapa');
        }
    };

    const deleteStage = async (id: string) => {
        try {
            await pipelineService.deleteStage(id);
            await load();
        } catch {
            toast.error('Erro ao remover etapa');
        }
    };

    return {
        pipelines,
        activePipeline,
        setActivePipeline,
        isLoading,
        reload: load,
        createPipeline,
        renamePipeline,
        deletePipeline,
        addStage,
        updateStage,
        deleteStage,
    };
}
