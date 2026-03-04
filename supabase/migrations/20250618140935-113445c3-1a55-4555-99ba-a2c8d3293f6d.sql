
-- 1. Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Allow lead insertion with valid user_id" ON public.leads;

-- Habilitar RLS na tabela leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção quando user_id é fornecido (mesmo em contexto público)
CREATE POLICY "Allow lead insertion with valid user_id" ON public.leads
FOR INSERT 
WITH CHECK (user_id IS NOT NULL);

-- Política para seleção (apenas o proprietário ou acesso público limitado)
CREATE POLICY "Users can view their own leads" ON public.leads
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Política para atualização (apenas o proprietário)
CREATE POLICY "Users can update their own leads" ON public.leads
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para exclusão (apenas o proprietário)
CREATE POLICY "Users can delete their own leads" ON public.leads
FOR DELETE 
USING (auth.uid() = user_id);

-- 2. Criar função para conversão segura de pending_leads para leads
CREATE OR REPLACE FUNCTION public.convert_pending_lead_secure(
  pending_lead_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_lead_record RECORD;
  campaign_user_id UUID;
  device_data_record RECORD;
  new_lead_id UUID;
  result JSON;
BEGIN
  -- Buscar o pending_lead
  SELECT * INTO pending_lead_record
  FROM pending_leads
  WHERE id = pending_lead_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pending lead not found or already converted');
  END IF;
  
  -- Buscar user_id da campanha
  SELECT user_id INTO campaign_user_id
  FROM campaigns
  WHERE id = pending_lead_record.campaign_id::uuid;
  
  -- Buscar dados do dispositivo
  SELECT * INTO device_data_record
  FROM device_data
  WHERE phone = pending_lead_record.phone
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Verificar se já existe lead para este telefone
  IF EXISTS (SELECT 1 FROM leads WHERE phone = pending_lead_record.phone) THEN
    -- Marcar como convertido mesmo que já exista
    UPDATE pending_leads
    SET status = 'converted'
    WHERE id = pending_lead_id;
    
    RETURN json_build_object('success', true, 'message', 'Lead already exists, marked as converted');
  END IF;
  
  -- Inserir novo lead
  INSERT INTO leads (
    name, phone, campaign, campaign_id, user_id, status,
    first_contact_date, notes, utm_source, utm_medium,
    utm_campaign, utm_content, utm_term,
    location, ip_address, browser, os, device_type,
    device_model, country, city, screen_resolution,
    timezone, language, custom_fields, initial_message
  ) VALUES (
    pending_lead_record.name,
    pending_lead_record.phone,
    pending_lead_record.campaign_name,
    pending_lead_record.campaign_id::uuid,
    campaign_user_id,
    'new',
    NOW(),
    'Lead criado automaticamente via conversão de pending_lead',
    pending_lead_record.utm_source,
    pending_lead_record.utm_medium,
    pending_lead_record.utm_campaign,
    pending_lead_record.utm_content,
    pending_lead_record.utm_term,
    COALESCE(device_data_record.location, ''),
    COALESCE(device_data_record.ip_address, ''),
    COALESCE(device_data_record.browser, ''),
    COALESCE(device_data_record.os, ''),
    COALESCE(device_data_record.device_type, ''),
    COALESCE(device_data_record.device_model, ''),
    COALESCE(device_data_record.country, ''),
    COALESCE(device_data_record.city, ''),
    COALESCE(device_data_record.screen_resolution, ''),
    COALESCE(device_data_record.timezone, ''),
    COALESCE(device_data_record.language, ''),
    CASE 
      WHEN device_data_record.id IS NOT NULL 
      THEN json_build_object('device_info', row_to_json(device_data_record))
      ELSE NULL 
    END,
    'Olá! Mensagem personalizada do lead enviada através do formulário'
  ) RETURNING id INTO new_lead_id;
  
  -- Marcar pending_lead como convertido
  UPDATE pending_leads
  SET status = 'converted'
  WHERE id = pending_lead_id;
  
  RETURN json_build_object(
    'success', true, 
    'lead_id', new_lead_id,
    'message', 'Lead converted successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
END;
$$;

-- 3. Criar função para conversão em lote
CREATE OR REPLACE FUNCTION public.convert_all_pending_leads()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_lead_record RECORD;
  conversion_result JSON;
  total_converted INTEGER := 0;
  total_errors INTEGER := 0;
  results JSON[] := '{}';
BEGIN
  FOR pending_lead_record IN 
    SELECT * FROM pending_leads WHERE status = 'pending'
  LOOP
    SELECT convert_pending_lead_secure(pending_lead_record.id) INTO conversion_result;
    
    IF (conversion_result->>'success')::boolean THEN
      total_converted := total_converted + 1;
    ELSE
      total_errors := total_errors + 1;
    END IF;
    
    results := results || conversion_result;
  END LOOP;
  
  RETURN json_build_object(
    'total_converted', total_converted,
    'total_errors', total_errors,
    'details', results
  );
END;
$$;
