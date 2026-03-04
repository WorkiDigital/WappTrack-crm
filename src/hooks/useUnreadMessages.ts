import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { evolutionService } from '@/services/evolutionService';
import { toast } from 'sonner';

export const useUnreadMessages = () => {
  // Mark all messages as read for a specific lead and reset unread count
  const markAsRead = useCallback(async (leadId: string, phone?: string) => {
    if (!leadId) return;

    try {
      // Reset unread_count on the lead
      const { error: leadError } = await supabase
        .from('leads')
        .update({ unread_count: 0 })
        .eq('id', leadId);

      if (leadError) {
        console.error('Error resetting unread count:', leadError);
        return;
      }

      // Mark all unread messages as read in DB
      const { error: messagesError } = await supabase
        .from('lead_messages')
        .update({ is_read: true })
        .eq('lead_id', leadId)
        .eq('is_from_me', false)
        .eq('is_read', false);

      if (messagesError) {
        console.error('Error marking messages as read:', messagesError);
      }

      // NOVO: Notificar Evolution API para mostrar check azul no WhatsApp do cliente
      if (phone) {
        // Buscar a instância usada nessa conversa (última mensagem recebida ou enviada)
        const { data: lastMsg } = await supabase
          .from('lead_messages')
          .select('instance_name')
          .eq('lead_id', leadId)
          .not('instance_name', 'is', null)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsg?.instance_name) {
          console.log(`👁️ Marcando mensagens como lidas no WhatsApp: ${phone} (${lastMsg.instance_name})`);
          await evolutionService.markRead(lastMsg.instance_name, phone);
        }
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  }, []);

  // Get total unread count across all leads (for potential navbar badge)
  const getTotalUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('unread_count');

      if (error) {
        console.error('Error fetching total unread count:', error);
        return 0;
      }

      return data?.reduce((sum, lead) => sum + (lead.unread_count || 0), 0) || 0;
    } catch (error) {
      console.error('Error in getTotalUnreadCount:', error);
      return 0;
    }
  }, []);

  return {
    markAsRead,
    getTotalUnreadCount,
  };
};
