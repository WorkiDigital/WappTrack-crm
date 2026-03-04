-- Migration to sync leads table with AI Agent features
-- Add agent_id to leads to link them to specific AI agents
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id);

-- Add current_stage_id to track which AI stage the lead is currently in
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS current_stage_id uuid REFERENCES public.agent_stages(id);

-- Add collected_variables to store data extracted by the AI during conversation
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS collected_variables jsonb DEFAULT '{}'::jsonb;

-- Ensure RLS is permissive for the leads table to allow the AI and UI to update it
DROP POLICY IF EXISTS "Enable all for public users" ON public.leads;
CREATE POLICY "Enable all for public users" ON public.leads FOR ALL USING (true) WITH CHECK (true);
