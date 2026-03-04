
-- Adicionar campos de dispositivo faltantes à tabela leads
ALTER TABLE public.leads ADD COLUMN location TEXT;
ALTER TABLE public.leads ADD COLUMN ip_address TEXT;
ALTER TABLE public.leads ADD COLUMN browser TEXT;
ALTER TABLE public.leads ADD COLUMN os TEXT;
ALTER TABLE public.leads ADD COLUMN device_type TEXT;
ALTER TABLE public.leads ADD COLUMN device_model TEXT;
ALTER TABLE public.leads ADD COLUMN tracking_method TEXT;
ALTER TABLE public.leads ADD COLUMN ad_account TEXT;
ALTER TABLE public.leads ADD COLUMN ad_set_name TEXT;
ALTER TABLE public.leads ADD COLUMN ad_name TEXT;
ALTER TABLE public.leads ADD COLUMN initial_message TEXT;
