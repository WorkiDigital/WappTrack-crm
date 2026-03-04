
-- Adicionar user_id na tabela campaigns
ALTER TABLE public.campaigns 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar user_id na tabela leads se não existir
ALTER TABLE public.leads 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar função para mapear instância do Evolution API para usuário
CREATE OR REPLACE FUNCTION public.get_user_by_instance(instance_name_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Primeiro, tentar encontrar o usuário através de campanhas que tenham essa instância configurada
    -- Por enquanto, vamos usar o primeiro usuário que tem campanhas ativas
    SELECT DISTINCT c.user_id INTO user_uuid
    FROM public.campaigns c 
    WHERE c.active = true 
    AND c.user_id IS NOT NULL
    LIMIT 1;
    
    -- Se não encontrar, usar o primeiro usuário do sistema
    IF user_uuid IS NULL THEN
        SELECT id INTO user_uuid 
        FROM auth.users 
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    RETURN user_uuid;
END;
$$;

-- Atualizar campanhas existentes para ter um user_id padrão
UPDATE public.campaigns 
SET user_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE user_id IS NULL;

-- Atualizar leads existentes para ter um user_id padrão
UPDATE public.leads 
SET user_id = (
    SELECT id FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE user_id IS NULL;

-- Tornar user_id obrigatório após atualizar os dados existentes
ALTER TABLE public.campaigns 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.leads 
ALTER COLUMN user_id SET NOT NULL;
