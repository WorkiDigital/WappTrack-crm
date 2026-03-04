-- Drop existing overly permissive "public" policies
DROP POLICY IF EXISTS "Enable all for public users" ON public.knowledge_bases;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agents;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_stages;
DROP POLICY IF EXISTS "Enable all for public users" ON public.stage_variables;
DROP POLICY IF EXISTS "Enable all for public users" ON public.stage_examples;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_channels;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_triggers;
DROP POLICY IF EXISTS "Enable all for public users" ON public.agent_knowledge_bases;

-- Recreate policies for AUTHENTICATED users
-- These policies allow any logged-in user to perform any operation on these tables.
-- This matches the intent of the previous "public" policies but restricts it to authenticated sessions.

CREATE POLICY "Enable all for authenticated users" ON public.knowledge_bases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.agents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.stage_variables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.stage_examples FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_triggers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_knowledge_bases FOR ALL TO authenticated USING (true) WITH CHECK (true);
