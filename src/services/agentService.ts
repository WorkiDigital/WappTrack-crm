import { supabase } from "@/integrations/supabase/client";
import {
    Agent, AgentInsert, AgentUpdate,
    AgentStage, AgentStageInsert, AgentStageUpdate,
    StageVariable, StageVariableInsert, StageVariableUpdate,
    StageExample, StageExampleInsert, StageExampleUpdate,
    AgentChannel, AgentChannelInsert, AgentChannelUpdate,
    KnowledgeBase, KnowledgeBaseInsert, KnowledgeBaseUpdate,
    AgentTrigger, AgentTriggerInsert, AgentTriggerUpdate
} from "@/types/agent";

export const agentService = {
    // Agents
    async getAgents() {
        const { data, error } = await supabase
            .from('agents')
            .select(`
        *,
        agent_stages (*, stage_variables (*), stage_examples (*)),
        agent_channels (*),
        agent_triggers (*)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getAgent(id: string) {
        const { data, error } = await supabase
            .from('agents')
            .select(`
        *,
        agent_stages (*, stage_variables (*), stage_examples (*)),
        agent_channels (*),
        agent_triggers (*),
        agent_knowledge_bases (
          is_enabled,
          knowledge_bases (*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async createAgent(agent: AgentInsert) {
        const { data, error } = await supabase
            .from('agents')
            .insert(agent)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAgent(id: string, agent: AgentUpdate) {
        const { data, error } = await supabase
            .from('agents')
            .update(agent)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAgent(id: string) {
        const { error } = await supabase
            .from('agents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Stages
    async getAgentStages(agentId: string) {
        const { data, error } = await supabase
            .from('agent_stages')
            .select(`
        *,
        stage_variables (*),
        stage_examples (*)
      `)
            .eq('agent_id', agentId)
            .order('stage_order', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createStage(stage: AgentStageInsert) {
        const { data, error } = await supabase
            .from('agent_stages')
            .insert(stage)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateStage(id: string, stage: AgentStageUpdate) {
        const { data, error } = await supabase
            .from('agent_stages')
            .update(stage)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteStage(id: string) {
        const { error } = await supabase
            .from('agent_stages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Variables
    async createVariable(variable: StageVariableInsert) {
        const { data, error } = await supabase
            .from('stage_variables')
            .insert(variable)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateVariable(id: string, variable: StageVariableUpdate) {
        const { data, error } = await supabase
            .from('stage_variables')
            .update(variable)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteVariable(id: string) {
        const { error } = await supabase
            .from('stage_variables')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Examples
    async createExample(example: StageExampleInsert) {
        const { data, error } = await supabase
            .from('stage_examples')
            .insert(example)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteExample(id: string) {
        const { error } = await supabase
            .from('stage_examples')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Channels
    async createChannel(channel: AgentChannelInsert) {
        const { data, error } = await supabase
            .from('agent_channels')
            .insert(channel)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateChannel(id: string, channel: AgentChannelUpdate) {
        const { data, error } = await supabase
            .from('agent_channels')
            .update(channel)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteChannel(id: string) {
        const { error } = await supabase
            .from('agent_channels')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Knowledge Bases
    async getKnowledgeBases() {
        const { data, error } = await supabase
            .from('knowledge_bases')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async createKnowledgeBase(kb: KnowledgeBaseInsert) {
        const { data, error } = await supabase
            .from('knowledge_bases')
            .insert(kb)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateKnowledgeBase(id: string, kb: KnowledgeBaseUpdate) {
        const { data, error } = await supabase
            .from('knowledge_bases')
            .update(kb)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteKnowledgeBase(id: string) {
        const { error } = await supabase
            .from('knowledge_bases')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async linkKnowledgeBase(agentId: string, kbId: string) {
        const { data, error } = await supabase
            .from('agent_knowledge_bases')
            .upsert({ agent_id: agentId, knowledge_base_id: kbId, is_enabled: true })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async unlinkKnowledgeBase(agentId: string, kbId: string) {
        const { error } = await supabase
            .from('agent_knowledge_bases')
            .delete()
            .match({ agent_id: agentId, knowledge_base_id: kbId });

        if (error) throw error;
    },

    // Triggers
    async createTrigger(trigger: AgentTriggerInsert) {
        const { data, error } = await supabase
            .from('agent_triggers')
            .insert(trigger)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTrigger(id: string) {
        const { error } = await supabase
            .from('agent_triggers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async duplicateAgent(id: string) {
        // 1. Get complete agent data
        const agent = await this.getAgent(id);

        // 2. Create new agent header
        const {
            id: oldId,
            created_at,
            updated_at,
            agent_stages,
            agent_channels,
            agent_triggers,
            agent_knowledge_bases,
            ...header
        } = agent;

        const newAgent = await this.createAgent({
            ...header as any,
            name: `${header.name} (Cópia)`,
            is_active: false
        });

        // 3. Duplicate stages, variables and examples
        if (agent_stages) {
            for (const stage of agent_stages) {
                const {
                    id: oldStageId,
                    created_at: s_ca,
                    updated_at: s_ua,
                    stage_variables,
                    stage_examples,
                    ...stageData
                } = stage;

                const newStage = await this.createStage({
                    ...stageData as any,
                    agent_id: newAgent.id
                });

                if (stage_variables) {
                    for (const v of stage_variables) {
                        const { id: vId, created_at: v_ca, ...vData } = v;
                        await this.createVariable({
                            ...vData as any,
                            stage_id: newStage.id
                        });
                    }
                }

                if (stage_examples) {
                    for (const ex of stage_examples) {
                        const { id: exId, created_at: ex_ca, ...exData } = ex;
                        await this.createExample({
                            ...exData as any,
                            stage_id: newStage.id
                        });
                    }
                }
            }
        }

        // 4. Duplicate triggers
        if (agent_triggers) {
            for (const t of agent_triggers) {
                const { id: tId, created_at: t_ca, ...tData } = t;
                await this.createTrigger({
                    ...tData as any,
                    agent_id: newAgent.id
                });
            }
        }

        // 5. Link knowledge bases
        if (agent_knowledge_bases) {
            for (const akb of agent_knowledge_bases) {
                if (akb.knowledge_base_id) {
                    await this.linkKnowledgeBase(newAgent.id, akb.knowledge_base_id);
                }
            }
        }

        return newAgent;
    }
};
