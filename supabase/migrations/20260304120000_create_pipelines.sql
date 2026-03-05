-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  stage_order INT NOT NULL DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  maps_to_status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add pipeline columns to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES pipeline_stages(id);

-- Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "user owns pipelines" ON pipelines;
CREATE POLICY "user owns pipelines" ON pipelines FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user owns pipeline_stages" ON pipeline_stages;
CREATE POLICY "user owns pipeline_stages" ON pipeline_stages FOR ALL USING (
  pipeline_id IN (SELECT id FROM pipelines WHERE user_id = auth.uid())
);
