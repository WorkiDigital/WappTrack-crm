
-- Criar tabela ctwa_tracking para armazenar dados de Click-to-WhatsApp
CREATE TABLE public.ctwa_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ctwa_clid TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  ip_address TEXT,
  device_info JSONB,
  utm_campaign TEXT,
  utm_medium TEXT,
  utm_content TEXT,
  utm_term TEXT,
  source_url TEXT,
  source_id TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para busca eficiente por CTWA CLID
CREATE INDEX idx_ctwa_tracking_ctwa_clid ON public.ctwa_tracking (ctwa_clid);

-- Criar índice para busca por campaign_id
CREATE INDEX idx_ctwa_tracking_campaign_id ON public.ctwa_tracking (campaign_id);

-- Habilitar Row Level Security
ALTER TABLE public.ctwa_tracking ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção (sem autenticação para funcionamento com webhook)
CREATE POLICY "Allow insert ctwa tracking" ON public.ctwa_tracking
  FOR INSERT WITH CHECK (true);

-- Criar política para permitir consulta (sem autenticação para funcionamento com webhook)
CREATE POLICY "Allow select ctwa tracking" ON public.ctwa_tracking
  FOR SELECT USING (true);

-- Habilitar realtime para a tabela
ALTER TABLE public.ctwa_tracking REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ctwa_tracking;
