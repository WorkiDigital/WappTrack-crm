
-- Criar tabela tracking_sessions para armazenar dados de sessão e UTMs
CREATE TABLE public.tracking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  browser_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  language TEXT,
  timezone TEXT,
  referrer TEXT,
  current_url TEXT,
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para otimizar as consultas de correlação
CREATE INDEX idx_tracking_sessions_session_id ON public.tracking_sessions(session_id);
CREATE INDEX idx_tracking_sessions_browser_fingerprint ON public.tracking_sessions(browser_fingerprint);
CREATE INDEX idx_tracking_sessions_ip_address ON public.tracking_sessions(ip_address);
CREATE INDEX idx_tracking_sessions_campaign_id ON public.tracking_sessions(campaign_id);
CREATE INDEX idx_tracking_sessions_created_at ON public.tracking_sessions(created_at);

-- Criar índice composto para consultas por múltiplos identificadores
CREATE INDEX idx_tracking_sessions_identifiers ON public.tracking_sessions(ip_address, user_agent, browser_fingerprint);
