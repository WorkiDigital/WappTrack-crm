export interface Pipeline {
    id: string;
    name: string;
    description: string | null;
    color: string;
    is_default: boolean;
    user_id: string;
    created_at: string;
    stages?: PipelineStage[];
}

export interface PipelineStage {
    id: string;
    pipeline_id: string;
    name: string;
    color: string;
    stage_order: number;
    is_won: boolean;
    is_lost: boolean;
    maps_to_status: string;
    created_at: string;
}

export interface PipelineInsert {
    name: string;
    description?: string;
    color?: string;
    is_default?: boolean;
}

export interface PipelineStageInsert {
    pipeline_id: string;
    name: string;
    color?: string;
    stage_order?: number;
    is_won?: boolean;
    is_lost?: boolean;
    maps_to_status?: string;
}
