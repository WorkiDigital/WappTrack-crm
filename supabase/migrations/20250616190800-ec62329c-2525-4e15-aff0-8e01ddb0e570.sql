
-- Create table to store UTM clicks for direct leads
CREATE TABLE public.utm_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster phone lookups
CREATE INDEX idx_utm_clicks_phone ON public.utm_clicks(phone);
CREATE INDEX idx_utm_clicks_created_at ON public.utm_clicks(created_at);

-- Enable RLS (though this table doesn't need user-specific access)
ALTER TABLE public.utm_clicks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (this is for system use)
CREATE POLICY "Allow all operations on utm_clicks" 
  ON public.utm_clicks 
  FOR ALL 
  USING (true);
