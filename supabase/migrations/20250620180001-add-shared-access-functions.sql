-- Migration: Add shared access functions
-- Functions to manage shared access tokens

-- Function to create a new shared access token
CREATE OR REPLACE FUNCTION create_shared_access_token(
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_permissions JSONB DEFAULT NULL,  -- Added NULL here
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions JSONB,
  name VARCHAR(255),
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token VARCHAR(255);
  new_id UUID;
BEGIN
  -- Generate a secure random token
  new_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Insert the new token
  INSERT INTO public.shared_access_tokens (
    token, 
    created_by, 
    name, 
    description, 
    permissions, 
    expires_at
  )
  VALUES (
    new_token,
    auth.uid(),
    p_name,
    p_description,
    p_permissions,
    p_expires_at
  )
  RETURNING shared_access_tokens.id INTO new_id;
  
  -- Return the created token data
  RETURN QUERY
  SELECT 
    sat.id,
    sat.token,
    sat.created_at,
    sat.expires_at,
    sat.permissions,
    sat.name,
    sat.description
  FROM public.shared_access_tokens sat
  WHERE sat.id = new_id;
END;
$$;

-- Function to validate and get token permissions
CREATE OR REPLACE FUNCTION get_token_permissions(p_token VARCHAR(255))
RETURNS TABLE(
  id UUID,
  permissions JSONB,
  name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sat.id,
    sat.permissions,
    sat.name,
    sat.description,
    sat.created_at,
    sat.expires_at
  FROM public.shared_access_tokens sat
  WHERE sat.token = p_token 
    AND sat.is_active = true 
    AND (sat.expires_at IS NULL OR sat.expires_at > NOW());
END;
$$;

-- Function to deactivate a token
CREATE OR REPLACE FUNCTION deactivate_shared_token(p_token_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shared_access_tokens 
  SET is_active = false 
  WHERE id = p_token_id AND created_by = auth.uid();
  
  RETURN FOUND;
END;
$$;
