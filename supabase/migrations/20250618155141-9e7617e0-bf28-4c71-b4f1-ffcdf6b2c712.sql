
-- Criar função RPC para inserir dados de tracking session
CREATE OR REPLACE FUNCTION public.insert_tracking_session(
  session_id TEXT,
  browser_fingerprint TEXT DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  screen_resolution TEXT DEFAULT NULL,
  language TEXT DEFAULT NULL,
  timezone TEXT DEFAULT NULL,
  referrer TEXT DEFAULT NULL,
  current_url TEXT DEFAULT NULL,
  campaign_id TEXT DEFAULT NULL,
  utm_source TEXT DEFAULT NULL,
  utm_medium TEXT DEFAULT NULL,
  utm_campaign TEXT DEFAULT NULL,
  utm_content TEXT DEFAULT NULL,
  utm_term TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.tracking_sessions (
    session_id, browser_fingerprint, ip_address, user_agent,
    screen_resolution, language, timezone, referrer, current_url,
    campaign_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
  );
END;
$$;

-- Criar função RPC para buscar dados de tracking por identificadores
CREATE OR REPLACE FUNCTION public.get_tracking_by_identifiers(
  p_browser_fingerprint TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  browser_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, t.session_id, t.browser_fingerprint, t.ip_address, t.user_agent,
    t.campaign_id, t.utm_source, t.utm_medium, t.utm_campaign, 
    t.utm_content, t.utm_term, t.created_at
  FROM public.tracking_sessions t
  WHERE t.created_at >= NOW() - INTERVAL '4 hours'
    AND (
      (p_browser_fingerprint IS NOT NULL AND t.browser_fingerprint = p_browser_fingerprint) OR
      (p_session_id IS NOT NULL AND t.session_id = p_session_id) OR
      (p_ip_address IS NOT NULL AND t.ip_address = p_ip_address)
    )
  ORDER BY t.created_at DESC
  LIMIT 1;
END;
$$;

-- Criar função RPC para consultas flexíveis na tabela tracking_sessions
CREATE OR REPLACE FUNCTION public.select_from_tracking_sessions(
  where_clause TEXT DEFAULT '',
  order_by TEXT DEFAULT 'created_at DESC',
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  browser_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  campaign_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  query_text TEXT;
BEGIN
  query_text := 'SELECT id, session_id, browser_fingerprint, ip_address, user_agent, ' ||
                'campaign_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, created_at ' ||
                'FROM public.tracking_sessions';
  
  IF where_clause != '' THEN
    query_text := query_text || ' WHERE ' || where_clause;
  END IF;
  
  IF order_by != '' THEN
    query_text := query_text || ' ORDER BY ' || order_by;
  END IF;
  
  IF limit_count > 0 THEN
    query_text := query_text || ' LIMIT ' || limit_count;
  END IF;
  
  RETURN QUERY EXECUTE query_text;
END;
$$;
