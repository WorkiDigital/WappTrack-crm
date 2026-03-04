-- Criar tabela de sessões UTM para rastreamento persistente (até 7 dias)
CREATE TABLE IF NOT EXISTS public.utm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  device_fingerprint JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(session_id, campaign_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_utm_sessions_campaign_id ON public.utm_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_utm_sessions_created_at ON public.utm_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_utm_sessions_expires_at ON public.utm_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_utm_sessions_session_id ON public.utm_sessions(session_id);

-- RLS Policy para permitir insert e select
ALTER TABLE public.utm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert utm_sessions" ON public.utm_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select utm_sessions" ON public.utm_sessions
  FOR SELECT USING (true);

-- Função para limpar sessões expiradas automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_utm_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.utm_sessions
  WHERE expires_at < NOW();
END;
$$;