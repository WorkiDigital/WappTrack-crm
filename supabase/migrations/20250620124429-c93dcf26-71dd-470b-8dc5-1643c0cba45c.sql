
-- Remover tabela de instâncias Evolution API se existir
DROP TABLE IF EXISTS public.evolution_instances CASCADE;

-- Remover tabela de leads pendentes se existir
DROP TABLE IF EXISTS public.pending_leads CASCADE;

-- Remover funções relacionadas à conversão de leads pendentes
DROP FUNCTION IF EXISTS public.convert_pending_lead_secure(uuid);
DROP FUNCTION IF EXISTS public.convert_all_pending_leads();
DROP FUNCTION IF EXISTS public.get_user_by_instance(text);
DROP FUNCTION IF EXISTS public.update_evolution_instances_updated_at();

-- Remover campos relacionados à Evolution API da tabela campaigns se existirem
ALTER TABLE public.campaigns 
DROP COLUMN IF EXISTS evolution_api_key,
DROP COLUMN IF EXISTS evolution_instance_name,
DROP COLUMN IF EXISTS evolution_base_url,
DROP COLUMN IF EXISTS webhook_callback_url,
DROP COLUMN IF EXISTS auto_create_leads;

-- Remover campos relacionados à Evolution API da tabela leads se existirem
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS evolution_message_id,
DROP COLUMN IF EXISTS evolution_status;

-- Limpar dados relacionados que possam ter ficado
DELETE FROM public.company_settings WHERE id IN (
  SELECT id FROM public.company_settings WHERE 
  company_name LIKE '%evolution%' OR 
  company_subtitle LIKE '%evolution%'
);
