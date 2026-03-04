
-- Adicionar coluna last_message na tabela leads
ALTER TABLE public.leads 
ADD COLUMN last_message TEXT;
