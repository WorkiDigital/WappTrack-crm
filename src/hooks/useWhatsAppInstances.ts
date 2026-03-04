import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { evolutionService } from '@/services/evolutionService';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  base_url: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map database column to interface property
      const mappedData = (data || []).map(item => ({
        ...item,
        name: item.instance_name
      })) as WhatsAppInstance[];
      setInstances(mappedData);
    } catch (error: any) {
      console.error('Error loading instances:', error);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instanceName: string, description?: string) => {
    if (!instanceName.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }

    // Validate instance name format
    const namePattern = /^[a-zA-Z0-9_-]+$/;
    if (!namePattern.test(instanceName.trim())) {
      toast.error('Nome da instância deve conter apenas letras, números, hífens e underscores');
      return;
    }

    if (instanceName.trim().length < 3 || instanceName.trim().length > 50) {
      toast.error('Nome da instância deve ter entre 3 e 50 caracteres');
      return;
    }

    // Check if instance name already exists
    const existingInstance = instances.find(instance =>
      instance.name.toLowerCase() === instanceName.trim().toLowerCase()
    );

    if (existingInstance) {
      toast.error('Já existe uma instância com este nome');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Você precisa estar autenticado para criar uma instância');
        throw new Error('Usuário não autenticado');
      }

      console.log('Creating Evolution instance:', instanceName);

      // First create instance in Evolution API
      const evolutionResult = await evolutionService.createEvolutionInstance(
        instanceName.trim(),
        `https://qdilrnnfmjkunxmukoek.supabase.co/functions/v1/evolution-webhook`
      );

      if (!evolutionResult.success) {
        console.error('Evolution API error:', evolutionResult.error);

        // Provide more specific error messages
        let userMessage = 'Erro ao criar instância na Evolution API';

        if (evolutionResult.error?.includes('inválido') || evolutionResult.error?.includes('invalid')) {
          userMessage = 'Nome da instância inválido. Use apenas letras, números, hífen e underscore (3-50 caracteres)';
        } else if (evolutionResult.error?.includes('já existe') || evolutionResult.error?.includes('already exists')) {
          userMessage = 'Uma instância com este nome já existe na Evolution API';
        } else if (evolutionResult.error?.includes('400')) {
          userMessage = 'Dados inválidos. Verifique o formato do nome da instância';
        } else if (evolutionResult.error?.includes('401') || evolutionResult.error?.includes('unauthorized')) {
          userMessage = 'Chave de API inválida ou não configurada';
        } else if (evolutionResult.error?.includes('500')) {
          userMessage = 'Erro interno da Evolution API. Tente novamente';
        } else if (evolutionResult.error?.includes('timeout') || evolutionResult.error?.includes('network')) {
          userMessage = 'Timeout ao conectar com a Evolution API. Verifique sua conexão';
        } else if (evolutionResult.error?.includes('Cannot read properties')) {
          userMessage = 'Erro de validação na Evolution API. Verifique o nome da instância';
        }

        toast.error(userMessage);
        throw new Error(userMessage);
      }

      console.log('Evolution instance created successfully, creating database record');

      // Then create in our database
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          instance_name: instanceName.trim(),
          description: description?.trim() || null,
          user_id: session.user.id,
          base_url: 'https://painelevo.workidigital.tech',
          status: 'disconnected',
          webhook_url: `https://qdilrnnfmjkunxmukoek.supabase.co/functions/v1/evolution-webhook`
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Erro ao salvar instância no banco de dados');
      }

      console.log('Instance created successfully:', data);
      // Map database column to interface property
      const mappedInstance = {
        ...data,
        name: data.instance_name
      } as WhatsAppInstance;
      setInstances(prev => [mappedInstance, ...prev]);
      toast.success('Instância criada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast.error(error.message || 'Erro ao criar instância');
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const updateInstanceStatus = async (instanceId: string, status: WhatsAppInstance['status']) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ status })
        .eq('id', instanceId);

      if (error) throw error;

      setInstances(prev =>
        prev.map(instance =>
          instance.id === instanceId ? { ...instance, status } : instance
        )
      );
    } catch (error: any) {
      console.error('Error updating instance status:', error);
      toast.error('Erro ao atualizar status da instância');
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
      toast.success('Instância removida com sucesso!');
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao remover instância');
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  return {
    instances,
    loading,
    creating,
    createInstance,
    updateInstanceStatus,
    deleteInstance,
    refetch: loadInstances
  };
};