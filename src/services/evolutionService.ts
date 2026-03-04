import { supabase } from '@/integrations/supabase/client';

export interface QRCodeResponse {
  success: boolean;
  qrcode?: string; // Agora este campo conterá a string base64 completa (com prefixo data:image/png;base64,)
  pairingCode?: string;
  error?: string;
}

export interface InstanceStatusResponse {
  success: boolean;
  status?: 'open' | 'close' | 'connecting' | 'qrcode' | 'disconnected';
  error?: string;
}

export interface DisconnectResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const evolutionService = {
  async createEvolutionInstance(instanceName: string, webhook?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-create-instance', {
        body: {
          instanceName,
          webhook
        }
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error creating Evolution instance:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Evolution instance'
      };
    }
  },

  async getQRCode(instanceId: string): Promise<QRCodeResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-qrcode', {
        body: {
          instanceId
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error getting QR code:', error);
      return {
        success: false,
        error: error.message || 'Failed to get QR code'
      };
    }
  },

  async getInstanceStatus(instanceId: string): Promise<InstanceStatusResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-status', {
        body: {
          instanceId
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error getting instance status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get instance status'
      };
    }
  },

  async disconnectInstance(instanceId: string): Promise<DisconnectResponse> {
    try {
      const { data, error } = await supabase.functions.invoke("evolution-disconnect", {
        body: {
          instanceId,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error("Error disconnecting instance:", error);
      return {
        success: false,
        error: error.message || "Failed to disconnect instance",
      };
    }
  },

  // Instance management methods
  async getAllInstances() {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting instances:', error);
      return { success: false, error: error.message };
    }
  },

  async createInstance(instanceName: string, description?: string) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName,
          description,
          user_id: authData.user.id,
          webhook_url: `https://kdnmzyaozdssdwegdwlb.supabase.co/functions/v1/evolution-webhook`
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating instance:', error);
      return { success: false, error: error.message };
    }
  },

  async updateInstanceStatus(instanceId: string, status: string) {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ status })
        .eq('id', instanceId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating instance status:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteInstance(instanceId: string) {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      return { success: false, error: error.message };
    }
  },

  async markRead(instanceName: string, remoteJid: string) {
    try {
      console.log(`👁️ Chamando evolution-mark-read para ${remoteJid}`);
      const { data, error } = await supabase.functions.invoke('evolution-mark-read', {
        body: {
          instanceName,
          remoteJid
        }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  },

  async syncWebhooks() {
    try {
      console.log('🔄 Sincronizando webhooks de todas as instâncias...');
      const { data, error } = await supabase.functions.invoke('evolution-sync-webhooks');

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error syncing webhooks:', error);
      return { success: false, error: error.message };
    }
  }
};


