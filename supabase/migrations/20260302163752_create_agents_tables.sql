-- knowledge_bases
CREATE TABLE IF NOT EXISTS public.knowledge_bases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- agents
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    persona_name TEXT,
    function TEXT,
    knowledge_content TEXT,
    behavior_rules TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- agent_stages
CREATE TABLE IF NOT EXISTS public.agent_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objective TEXT,
    success_criteria TEXT,
    ia_context TEXT,
    stage_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- stage_variables
CREATE TABLE IF NOT EXISTS public.stage_variables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID NOT NULL REFERENCES public.agent_stages(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    field_type TEXT,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- stage_examples
CREATE TABLE IF NOT EXISTS public.stage_examples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id UUID NOT NULL REFERENCES public.agent_stages(id) ON DELETE CASCADE,
    role TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- agent_channels
CREATE TABLE IF NOT EXISTS public.agent_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    channel_type TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- agent_triggers
CREATE TABLE IF NOT EXISTS public.agent_triggers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    phrase TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- agent_knowledge_bases
CREATE TABLE IF NOT EXISTS public.agent_knowledge_bases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    knowledge_base_id UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(agent_id, knowledge_base_id)
);

-- Enable RLS
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_knowledge_bases ENABLE ROW LEVEL SECURITY;

-- Creating extremely permissive RLS policies for now to avoid breaking the frontend logic
-- (The original Trackv4 DB probably had similar permissive policies or no policies)

CREATE POLICY "Enable all for authenticated users" ON public.knowledge_bases FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.agents FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_stages FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.stage_variables FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.stage_examples FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_channels FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_triggers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.agent_knowledge_bases FOR ALL TO authenticated USING (true);
