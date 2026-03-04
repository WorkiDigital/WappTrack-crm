
-- Criar tabela para leads pendentes (antes da confirmação do webhook)
CREATE TABLE public.pending_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  webhook_data JSONB,
  status TEXT DEFAULT 'pending' -- pending, confirmed, failed
);

-- Criar índices para performance
CREATE INDEX idx_pending_leads_phone ON public.pending_leads(phone);
CREATE INDEX idx_pending_leads_campaign_id ON public.pending_leads(campaign_id);
CREATE INDEX idx_pending_leads_status ON public.pending_leads(status);

-- Adicionar campos na tabela campaigns para configurações da Evolution API
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS evolution_api_key TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS evolution_base_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS webhook_callback_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS auto_create_leads BOOLEAN DEFAULT true;

-- Adicionar campo para tracking de origem na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS evolution_message_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS evolution_status TEXT;
