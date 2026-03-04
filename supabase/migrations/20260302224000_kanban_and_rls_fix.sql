-- Add funnel_status to agent_stages to allow mapping AI stages to CRM Kanban columns
ALTER TABLE public.agent_stages ADD COLUMN IF NOT EXISTS funnel_status text;

-- Add constraint to ensure it's one of the valid statuses if needed, 
-- but we'll handle validation in the app to keep it flexible.

-- Ensure all agent tables have public access with proper WITH CHECK
DROP POLICY IF EXISTS "Enable all for public users" ON public.knowledge_bases;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agents;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_stages;
DROP POLICY IF EXISTS "Enable all for public users" ON public.stage_variables;
DROP POLICY IF EXISTS "Enable all for public users" ON public.stage_examples;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_channels;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_triggers;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_knowledge_bases;

CREATE POLICY "Enable all for public users" ON public.knowledge_bases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.agent_stages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.stage_variables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.stage_examples FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.agent_channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.agent_triggers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for public users" ON public.agent_knowledge_bases FOR ALL USING (true) WITH CHECK (true);
