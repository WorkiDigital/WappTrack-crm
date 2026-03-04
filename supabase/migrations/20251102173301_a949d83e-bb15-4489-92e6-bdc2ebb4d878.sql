-- Adicionar coluna lead_tracking_id para rastreamento único de leads
ALTER TABLE public.pending_leads 
ADD COLUMN lead_tracking_id TEXT;

ALTER TABLE public.leads 
ADD COLUMN lead_tracking_id TEXT;

-- Criar índice para busca rápida por lead_tracking_id
CREATE INDEX idx_pending_leads_tracking_id ON public.pending_leads(lead_tracking_id);
CREATE INDEX idx_leads_tracking_id ON public.leads(lead_tracking_id);

-- Comentários para documentação
COMMENT ON COLUMN public.pending_leads.lead_tracking_id IS 'ID único de 6 caracteres para rastreamento preciso do lead (ex: A1C9F2)';
COMMENT ON COLUMN public.leads.lead_tracking_id IS 'ID único de 6 caracteres copiado do pending_lead para rastreamento';