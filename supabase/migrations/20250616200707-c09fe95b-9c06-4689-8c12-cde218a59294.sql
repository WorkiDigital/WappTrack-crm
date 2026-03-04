
-- Adicionar campos de dispositivo faltantes à tabela leads
ALTER TABLE public.leads ADD COLUMN country TEXT;
ALTER TABLE public.leads ADD COLUMN city TEXT; 
ALTER TABLE public.leads ADD COLUMN screen_resolution TEXT;
ALTER TABLE public.leads ADD COLUMN timezone TEXT;
ALTER TABLE public.leads ADD COLUMN language TEXT;
