
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePendingLeadConverter = () => {
  const [isConverting, setIsConverting] = useState(false);

  const convertPendingLead = async (pendingLeadId: string) => {
    setIsConverting(true);
    try {
      // Get pending lead data
      const { data: pendingLead, error: fetchError } = await supabase
        .from('pending_leads')
        .select('*')
        .eq('id', pendingLeadId)
        .single();

      if (fetchError || !pendingLead) {
        throw new Error('Pending lead not found');
      }

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert to regular lead
      const { error: insertError } = await supabase
        .from('leads')
        .insert({
          name: pendingLead.name,
          phone: pendingLead.phone,
          campaign: pendingLead.campaign_name || 'Unknown',
          campaign_id: pendingLead.campaign_id,
          status: 'new',
          user_id: user.id,
          utm_source: pendingLead.utm_source || '',
          utm_medium: pendingLead.utm_medium || '',
          utm_campaign: pendingLead.utm_campaign || '',
          utm_content: pendingLead.utm_content || '',
          utm_term: pendingLead.utm_term || ''
        });

      if (insertError) {
        throw insertError;
      }

      // Delete pending lead
      const { error: deleteError } = await supabase
        .from('pending_leads')
        .delete()
        .eq('id', pendingLeadId);

      if (deleteError) {
        throw deleteError;
      }

      toast.success('Lead convertido com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error converting pending lead:', error);
      toast.error(`Erro ao converter lead: ${error.message}`);
      return false;
    } finally {
      setIsConverting(false);
    }
  };

  const convertPendingLeads = async () => {
    setIsConverting(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all pending leads
      const { data: pendingLeads, error: fetchError } = await supabase
        .from('pending_leads')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      if (!pendingLeads || pendingLeads.length === 0) {
        toast.info('Nenhum lead pendente encontrado');
        return true;
      }

      let successCount = 0;
      let errorCount = 0;

      // Convert each pending lead
      for (const pendingLead of pendingLeads) {
        try {
          // Convert to regular lead
          const { error: insertError } = await supabase
            .from('leads')
            .insert({
              name: pendingLead.name,
              phone: pendingLead.phone,
              campaign: pendingLead.campaign_name || 'Unknown',
              campaign_id: pendingLead.campaign_id,
              status: 'new',
              user_id: user.id,
              utm_source: pendingLead.utm_source || '',
              utm_medium: pendingLead.utm_medium || '',
              utm_campaign: pendingLead.utm_campaign || '',
              utm_content: pendingLead.utm_content || '',
              utm_term: pendingLead.utm_term || ''
            });

          if (insertError) {
            throw insertError;
          }

          // Delete pending lead
          const { error: deleteError } = await supabase
            .from('pending_leads')
            .delete()
            .eq('id', pendingLead.id);

          if (deleteError) {
            throw deleteError;
          }

          successCount++;
        } catch (error) {
          console.error(`Error converting pending lead ${pendingLead.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} leads convertidos com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} leads falharam na conversão`);
      }

      return true;
    } catch (error: any) {
      console.error('Error converting pending leads:', error);
      toast.error(`Erro ao converter leads: ${error.message}`);
      return false;
    } finally {
      setIsConverting(false);
    }
  };

  return {
    convertPendingLead,
    convertPendingLeads,
    isConverting
  };
};
