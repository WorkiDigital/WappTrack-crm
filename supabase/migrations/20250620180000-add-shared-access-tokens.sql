-- Migration: Add shared access tokens table
-- This table will store tokens for public access with configurable permissions

CREATE TABLE IF NOT EXISTS public.shared_access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  name VARCHAR(255),
  description TEXT
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_shared_access_tokens_token ON public.shared_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_shared_access_tokens_active ON public.shared_access_tokens(is_active);

-- Enable RLS
ALTER TABLE public.shared_access_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_access_tokens
-- Allow authenticated users to view their own tokens
CREATE POLICY "Users can view their own shared tokens" 
  ON public.shared_access_tokens 
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Allow authenticated users to create tokens
CREATE POLICY "Users can create shared tokens" 
  ON public.shared_access_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to update their own tokens
CREATE POLICY "Users can update their own shared tokens" 
  ON public.shared_access_tokens 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Allow authenticated users to delete their own tokens
CREATE POLICY "Users can delete their own shared tokens" 
  ON public.shared_access_tokens 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Allow public access to validate tokens (for shared access)
CREATE POLICY "Public can validate active tokens" 
  ON public.shared_access_tokens 
  FOR SELECT 
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));


