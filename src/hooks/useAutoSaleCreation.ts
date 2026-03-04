
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';
import { toast } from 'sonner';

export const useAutoSaleCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createSaleFromConvertedLead = async (lead: Lead) => {
    setIsCreating(true);
    try {
      console.log('🎯 [AUTO SALE] Criando venda automática para lead convertido:', {
        leadId: lead.id,
        leadName: lead.name,
        campaign: lead.campaign,
        status: lead.status
      });

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 🆕 PREPARAR DADOS DA VENDA COM INFORMAÇÕES DO LEAD
      const saleData = {
        amount: 0, // Valor inicial, pode ser editado posteriormente
        sale_date: new Date().toISOString(),
        status: 'pending' as const,
        notes: `Venda criada automaticamente quando lead ${lead.name} foi convertido. Campanha: ${lead.campaign}`,
        lead_id: lead.id,
        campaign_id: lead.campaign,
        // 🆕 PRESERVAR TAGS E DADOS UTM
        custom_fields: {
          lead_data: {
            utm_source: lead.utm_source,
            utm_medium: lead.utm_medium,
            utm_campaign: lead.utm_campaign,
            utm_content: lead.utm_content,
            utm_term: lead.utm_term,
            ad_account: lead.ad_account,
            ad_set_name: lead.ad_set_name,
            ad_name: lead.ad_name,
            tracking_method: lead.tracking_method,
            device_type: lead.device_type,
            location: lead.location,
            original_tags: lead.custom_fields || {}
          }
        }
      };

      console.log('💾 [AUTO SALE] Dados da venda a ser criada:', saleData);

      const { data: newSale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) {
        console.error('❌ [AUTO SALE] Erro ao criar venda:', saleError);
        throw new Error(`Erro ao criar venda: ${saleError.message}`);
      }

      console.log('✅ [AUTO SALE] Venda criada com sucesso:', {
        saleId: newSale.id,
        leadId: lead.id,
        amount: newSale.amount,
        preservedTags: Object.keys(saleData.custom_fields.lead_data).length
      });

      toast.success(`Venda criada automaticamente para ${lead.name}! Verifique a aba Vendas.`);
      
      return newSale;

    } catch (error: any) {
      console.error('❌ [AUTO SALE] Erro detalhado:', error);
      toast.error(`Erro ao criar venda automática: ${error.message}`);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createSaleFromConvertedLead,
    isCreating
  };
};
