
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLeads } from '@/services/dataService';
import { toast } from "sonner";
import { Lead } from '@/types';

export const usePhoneFixer = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fixPhoneNumbers = async (): Promise<Lead[]> => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando correção de números de telefone...');
      
      const { data: allLeads, error: fetchError } = await supabase
        .from('leads')
        .select('*');

      if (fetchError) {
        console.error('Erro ao buscar leads:', fetchError);
        toast.error('Erro ao buscar leads');
        throw fetchError;
      }

      console.log('Total de leads encontrados:', allLeads?.length);

      let correctedCount = 0;

      for (const lead of allLeads || []) {
        const originalPhone = lead.phone;
        let correctedPhone = originalPhone;

        if (originalPhone === '5585998732658') {
          correctedPhone = '558598372658';
          console.log(`Corrigindo número específico: ${originalPhone} -> ${correctedPhone}`);
        }
        else if (originalPhone.startsWith('55') && originalPhone.length === 13) {
          const withoutCountryCode = originalPhone.slice(2);
          if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9' && withoutCountryCode[3] === '9') {
            correctedPhone = '55' + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3);
            console.log(`Removendo 9 duplicado: ${originalPhone} -> ${correctedPhone}`);
          }
        }

        if (correctedPhone !== originalPhone) {
          const { error: updateError } = await supabase
            .from('leads')
            .update({ phone: correctedPhone })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`Erro ao atualizar lead ${lead.id}:`, updateError);
          } else {
            console.log(`Lead ${lead.name} (${lead.id}) atualizado: ${originalPhone} -> ${correctedPhone}`);
            correctedCount++;
          }
        }
      }

      if (correctedCount > 0) {
        toast.success(`${correctedCount} número(s) corrigido(s) com sucesso!`);
        const leadsData = await getLeads();
        console.log(`Processo de correção finalizado. ${correctedCount} números corrigidos.`);
        return leadsData;
      } else {
        toast.info('Nenhum número problemático encontrado para correção');
        // Transform the raw Supabase data to match Lead interface, handling Json type properly
        const transformedLeads: Lead[] = (allLeads || []).map(lead => ({
          id: lead.id,
          created_at: lead.created_at,
          name: lead.name,
          phone: lead.phone,
          campaign: lead.campaign,
          status: lead.status as Lead['status'],
          notes: lead.notes,
          first_contact_date: lead.first_contact_date,
          last_contact_date: lead.last_contact_date,
          custom_fields: (typeof lead.custom_fields === 'object' && lead.custom_fields !== null) 
            ? lead.custom_fields as Record<string, any> 
            : {},
          whatsapp_delivery_attempts: lead.whatsapp_delivery_attempts,
          last_whatsapp_attempt: lead.last_whatsapp_attempt,
          last_message: lead.last_message,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          utm_content: lead.utm_content,
          utm_term: lead.utm_term,
          location: lead.location,
          ip_address: lead.ip_address,
          browser: lead.browser,
          os: lead.os,
          device_type: lead.device_type,
          device_model: lead.device_model,
          tracking_method: lead.tracking_method,
          ad_account: lead.ad_account,
          ad_set_name: lead.ad_set_name,
          ad_name: lead.ad_name,
          initial_message: lead.initial_message,
          country: lead.country,
          city: lead.city,
          screen_resolution: lead.screen_resolution,
          timezone: lead.timezone,
          language: lead.language,
          facebook_ad_id: lead.facebook_ad_id,
          facebook_adset_id: lead.facebook_adset_id,
          facebook_campaign_id: lead.facebook_campaign_id
        }));
        return transformedLeads;
      }

    } catch (error) {
      console.error('Error fixing phone numbers:', error);
      toast.error('Erro ao corrigir números');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { fixPhoneNumbers, isLoading };
};
