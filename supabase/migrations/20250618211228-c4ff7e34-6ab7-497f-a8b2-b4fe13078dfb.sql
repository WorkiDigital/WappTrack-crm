
-- Adicionar campos específicos do Facebook Ads na tabela leads
ALTER TABLE public.leads 
ADD COLUMN facebook_ad_id text,
ADD COLUMN facebook_adset_id text,
ADD COLUMN facebook_campaign_id text;

-- Adicionar campos correspondentes na tabela device_data também
ALTER TABLE public.device_data 
ADD COLUMN facebook_ad_id text,
ADD COLUMN facebook_adset_id text,
ADD COLUMN facebook_campaign_id text;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.leads.facebook_ad_id IS 'ID do anúncio específico do Facebook Ads';
COMMENT ON COLUMN public.leads.facebook_adset_id IS 'ID do conjunto de anúncios do Facebook Ads';
COMMENT ON COLUMN public.leads.facebook_campaign_id IS 'ID da campanha do Facebook Ads (diferente do campaign_id interno)';

COMMENT ON COLUMN public.device_data.facebook_ad_id IS 'ID do anúncio específico do Facebook Ads';
COMMENT ON COLUMN public.device_data.facebook_adset_id IS 'ID do conjunto de anúncios do Facebook Ads';
COMMENT ON COLUMN public.device_data.facebook_campaign_id IS 'ID da campanha do Facebook Ads';
