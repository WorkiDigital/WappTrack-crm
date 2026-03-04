-- Tornar instance_id opcional na tabela agents
-- Permite criar agentes sem precisar de uma instância WhatsApp previamente conectada
ALTER TABLE public.agents ALTER COLUMN instance_id DROP NOT NULL;
