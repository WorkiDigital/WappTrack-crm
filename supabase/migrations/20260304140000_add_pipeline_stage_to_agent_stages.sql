-- Add pipeline_stage_id to agent_stages so the AI agent can move leads to a specific pipeline stage
ALTER TABLE agent_stages
  ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;
