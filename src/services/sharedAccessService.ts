
import { supabase } from '../integrations/supabase/client';

export interface SharedTokenData {
  id: string;
  token: string;
  permissions: any;
  name: string;
  description?: string;
  created_at: string;
  expires_at?: string;
}

export interface CreateSharedTokenParams {
  name: string;
  description?: string;
  permissions: any;
  expires_at?: string;
}

export const createSharedToken = async (params: CreateSharedTokenParams): Promise<SharedTokenData | null> => {
  try {
    const { data, error } = await supabase.rpc('create_shared_access_token', {
      p_name: params.name,
      p_description: params.description || null,
      p_permissions: params.permissions,
      p_expires_at: params.expires_at || null,
    });

    if (error) {
      console.error('Error creating shared token:', error);
      throw new Error(`Failed to create shared access token: ${error.message}`);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in createSharedToken:', error);
    throw error;
  }
};

export const getSharedTokenPermissions = async (token: string): Promise<SharedTokenData | null> => {
  try {
    const { data, error } = await supabase.rpc('get_token_permissions', {
      p_token: token,
    });

    if (error) {
      console.error('Error getting token permissions:', error);
      return null;
    }

    const tokenData = data?.[0];
    if (!tokenData) return null;

    return {
      id: tokenData.id,
      token: token, // Include the token since it's required
      permissions: tokenData.permissions,
      name: tokenData.name,
      description: tokenData.description,
      created_at: tokenData.created_at,
      expires_at: tokenData.expires_at
    };
  } catch (error) {
    console.error('Error in getSharedTokenPermissions:', error);
    return null;
  }
};

export const deactivateSharedToken = async (tokenId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('deactivate_shared_token', {
      p_token_id: tokenId,
    });

    if (error) {
      console.error('Error deactivating token:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in deactivateSharedToken:', error);
    return false;
  }
};

export const getUserSharedTokens = async (): Promise<SharedTokenData[]> => {
  try {
    // Since shared_access_tokens table doesn't exist in current schema,
    // we'll return an empty array for now
    console.log('getUserSharedTokens: shared_access_tokens table not available in current schema');
    return [];
  } catch (error) {
    console.error('Error in getUserSharedTokens:', error);
    return [];
  }
};
