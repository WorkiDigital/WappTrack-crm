
-- Criar tabela para mapear instâncias do Evolution API com usuários específicos
CREATE TABLE public.evolution_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  instance_id text,
  api_key text,
  base_url text,
  phone_number text,
  is_default_for_organic boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(instance_name, user_id)
);

-- Adicionar índices para performance
CREATE INDEX idx_evolution_instances_user_id ON public.evolution_instances(user_id);
CREATE INDEX idx_evolution_instances_instance_name ON public.evolution_instances(instance_name);
CREATE INDEX idx_evolution_instances_default_organic ON public.evolution_instances(is_default_for_organic) WHERE is_default_for_organic = true;

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias instâncias
CREATE POLICY "Users can view their own instances" 
  ON public.evolution_instances 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias instâncias
CREATE POLICY "Users can create their own instances" 
  ON public.evolution_instances 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias instâncias
CREATE POLICY "Users can update their own instances" 
  ON public.evolution_instances 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias instâncias
CREATE POLICY "Users can delete their own instances" 
  ON public.evolution_instances 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para buscar usuário por instância (usada pelo webhook)
CREATE OR REPLACE FUNCTION public.get_user_by_instance(instance_name_param text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_id 
  FROM public.evolution_instances 
  WHERE instance_name = instance_name_param 
    AND active = true 
  ORDER BY is_default_for_organic DESC, created_at ASC 
  LIMIT 1;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_evolution_instances_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER evolution_instances_updated_at
  BEFORE UPDATE ON public.evolution_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_evolution_instances_updated_at();
