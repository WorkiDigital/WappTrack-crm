
-- Criar tabela device_data para armazenar dados dos dispositivos
CREATE TABLE public.device_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phone TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  device_model TEXT,
  location TEXT,
  country TEXT,
  city TEXT,
  referrer TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT
);

-- Criar índice para busca eficiente por telefone e data
CREATE INDEX idx_device_data_phone_created_at ON public.device_data (phone, created_at DESC);

-- Criar índice para busca por telefone
CREATE INDEX idx_device_data_phone ON public.device_data (phone);

-- Habilitar Row Level Security
ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção (sem autenticação para funcionamento com webhook)
CREATE POLICY "Allow insert device data" ON public.device_data
  FOR INSERT WITH CHECK (true);

-- Criar política para permitir consulta (sem autenticação para funcionamento com webhook)
CREATE POLICY "Allow select device data" ON public.device_data
  FOR SELECT USING (true);

-- Habilitar realtime para a tabela
ALTER TABLE public.device_data REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_data;
