-- Update RLS policies for Agent tables to allow public access temporarily 
-- (while auth session handling is finalized in the frontend)

-- Drop existing "TO authenticated" policies
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.knowledge_bases;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.agents;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.agent_stages;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.stage_variables;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.stage_examples;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.agent_channels;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.agent_triggers;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.agent_knowledge_bases;

-- Create fully permissive policies (to mimic the original wapptrack V4 database setup)
CREATE POLICY "Enable all for public users" ON public.knowledge_bases FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.agents FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.agent_stages FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.stage_variables FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.stage_examples FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.agent_channels FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.agent_triggers FOR ALL USING (true);
CREATE POLICY "Enable all for public users" ON public.agent_knowledge_bases FOR ALL USING (true);
