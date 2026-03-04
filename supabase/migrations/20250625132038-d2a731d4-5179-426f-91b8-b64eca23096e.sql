
-- Criar tabela para armazenar dados do dispositivo
CREATE TABLE public.device_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  ip_address TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  device_model TEXT,
  location TEXT,
  country TEXT,
  city TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  facebook_ad_id TEXT,
  facebook_adset_id TEXT,
  facebook_campaign_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice no telefone para buscas rápidas
CREATE INDEX idx_device_data_phone ON public.device_data(phone);

-- Criar índice na data de criação para limpeza de dados antigos
CREATE INDEX idx_device_data_created_at ON public.device_data(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção de dados do dispositivo
CREATE POLICY "Allow device data insertion" ON public.device_data
FOR INSERT WITH CHECK (true);

-- Criar política para permitir leitura de dados do dispositivo
CREATE POLICY "Allow device data reading" ON public.device_data
FOR SELECT USING (true);

-- Adicionar função de atualização automática do updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_device_data_updated_at BEFORE UPDATE
ON public.device_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
