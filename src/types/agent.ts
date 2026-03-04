import { Database } from '../integrations/supabase/types';

export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type AgentStage = Database['public']['Tables']['agent_stages']['Row'];
export type AgentStageInsert = Database['public']['Tables']['agent_stages']['Insert'];
export type AgentStageUpdate = Database['public']['Tables']['agent_stages']['Update'];

export type StageVariable = Database['public']['Tables']['stage_variables']['Row'];
export type StageVariableInsert = Database['public']['Tables']['stage_variables']['Insert'];
export type StageVariableUpdate = Database['public']['Tables']['stage_variables']['Update'];

export type StageExample = Database['public']['Tables']['stage_examples']['Row'];
export type StageExampleInsert = Database['public']['Tables']['stage_examples']['Insert'];
export type StageExampleUpdate = Database['public']['Tables']['stage_examples']['Update'];

export type AgentChannel = Database['public']['Tables']['agent_channels']['Row'];
export type AgentChannelInsert = Database['public']['Tables']['agent_channels']['Insert'];
export type AgentChannelUpdate = Database['public']['Tables']['agent_channels']['Update'];

export type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row'];
export type KnowledgeBaseInsert = Database['public']['Tables']['knowledge_bases']['Insert'];
export type KnowledgeBaseUpdate = Database['public']['Tables']['knowledge_bases']['Update'];

export type AgentTrigger = Database['public']['Tables']['agent_triggers']['Row'];
export type AgentTriggerInsert = Database['public']['Tables']['agent_triggers']['Insert'];
export type AgentTriggerUpdate = Database['public']['Tables']['agent_triggers']['Update'];

export interface AgentStageWithRelations extends AgentStage {
    stage_variables?: (StageVariable & { name?: string; required?: boolean })[];
    stage_examples?: (StageExample & { user_input?: string; agent_response?: string })[];
}

export interface AgentWithRelations extends Agent {
    agent_stages?: AgentStageWithRelations[];
    agent_channels?: AgentChannel[];
    agent_triggers?: AgentTrigger[];
    agent_knowledge_bases?: { is_enabled: boolean | null; knowledge_base_id: string; knowledge_bases: KnowledgeBase | null }[];
}
