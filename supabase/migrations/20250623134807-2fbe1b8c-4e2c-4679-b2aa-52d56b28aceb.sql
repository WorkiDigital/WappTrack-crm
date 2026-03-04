
-- Add custom_fields column to sales table to store lead data and UTM parameters
ALTER TABLE public.sales 
ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
