
-- Atualizar a tabela leads para incluir os novos status
-- Vamos adicionar uma coluna para rastrear tentativas de entrega do WhatsApp
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_delivery_attempts INTEGER DEFAULT 0;

-- Adicionar uma coluna para timestamp da última tentativa de entrega
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_whatsapp_attempt TIMESTAMP WITH TIME ZONE;

-- Atualizar qualquer lead existente com status 'new' que ainda não foi processado
-- Os novos status serão: 'lead' (chegou no WhatsApp) e 'to_recover' (precisa recuperar)
