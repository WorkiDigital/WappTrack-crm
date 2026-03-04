import { Lead } from "../types";
import { supabase } from "../integrations/supabase/client";
import { getDeviceDataByPhone } from "./deviceDataService";

export const getLeads = async (): Promise<Lead[]> => {
  try {
    console.log('🔄 leadService.getLeads() - Iniciando busca...');

    // Fetch leads from Supabase
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📋 leadService.getLeads() - Dados brutos do Supabase:', leads?.length || 0, 'leads encontrados');

    // Map database fields to our Lead interface - INCLUINDO novos campos do Facebook
    const mappedLeads = (leads as any[] || []).map((lead: any) => {
      console.log(`🔍 leadService.getLeads() - Mapeando lead ${lead.name}:`, {
        id: lead.id,
        user_id: lead.user_id,
        last_message: lead.last_message,
        device_type: lead.device_type,
        location: lead.location,
        facebook_ad_id: lead.facebook_ad_id,
        facebook_adset_id: lead.facebook_adset_id,
        facebook_campaign_id: lead.facebook_campaign_id
      });

      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        campaign: lead.campaign_id || lead.campaign || '',
        status: lead.status as Lead['status'],
        created_at: lead.created_at,
        custom_fields: lead.custom_fields as Record<string, string>,
        notes: lead.notes,
        first_contact_date: lead.first_contact_date,
        last_contact_date: lead.last_contact_date,
        last_message: lead.last_message || null,
        utm_source: lead.utm_source || '',
        utm_medium: lead.utm_medium || '',
        utm_campaign: lead.utm_campaign || '',
        utm_content: lead.utm_content || '',
        utm_term: lead.utm_term || '',
        // Campos existentes
        location: lead.location || '',
        ip_address: lead.ip_address || '',
        browser: lead.browser || '',
        os: lead.os || '',
        device_type: lead.device_type || '',
        device_model: lead.device_model || '',
        tracking_method: lead.tracking_method || 'direct',
        ad_account: lead.ad_account || '',
        ad_set_name: lead.ad_set_name || '',
        ad_name: lead.ad_name || '',
        initial_message: lead.initial_message || '',
        country: lead.country || '',
        city: lead.city || '',
        screen_resolution: lead.screen_resolution || '',
        timezone: lead.timezone || '',
        language: lead.language || '',
        // 🎯 NOVOS CAMPOS DO FACEBOOK ADS
        facebook_ad_id: lead.facebook_ad_id || '',
        facebook_adset_id: lead.facebook_adset_id || '',
        facebook_campaign_id: lead.facebook_campaign_id || '',
        user_id: lead.user_id,
        agent_id: lead.agent_id,
        current_stage_id: lead.current_stage_id,
        collected_variables: (lead.collected_variables || {}) as Record<string, any>
      };
    });

    console.log('✅ leadService.getLeads() - Leads mapeados:', mappedLeads.length, 'leads processados');

    return mappedLeads;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
};

export const addLead = async (lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> => {
  try {
    console.log('🔄 addLead - Iniciando criação de lead:', lead.name, lead.phone);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // 🎯 BUSCAR DADOS DO DISPOSITIVO SALVOS PARA ESTE TELEFONE (incluindo Facebook Ads)
    let deviceData = null;
    if (lead.phone) {
      console.log('📱 Buscando dados do dispositivo para telefone:', lead.phone);
      deviceData = await getDeviceDataByPhone(lead.phone);

      if (deviceData) {
        console.log('✅ Dados do dispositivo encontrados (com Facebook Ads):', {
          device_type: deviceData.device_type,
          browser: deviceData.browser,
          location: deviceData.location,
          ip_address: deviceData.ip_address,
          facebook_ad_id: deviceData.facebook_ad_id,
          facebook_adset_id: deviceData.facebook_adset_id,
          facebook_campaign_id: deviceData.facebook_campaign_id
        });
      } else {
        console.log('❌ Nenhum dado do dispositivo encontrado para:', lead.phone);
      }
    }

    // Preparar dados do lead com informações do dispositivo se disponíveis
    const leadData = {
      name: lead.name,
      phone: lead.phone,
      campaign: lead.campaign,
      status: lead.status || 'new',
      custom_fields: lead.custom_fields || {},
      notes: lead.notes || '',
      first_contact_date: lead.first_contact_date || null,
      last_contact_date: lead.last_contact_date || null,
      last_message: lead.last_message || null,
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_content: lead.utm_content || '',
      utm_term: lead.utm_term || '',
      // Dados do dispositivo existentes
      location: deviceData?.location || lead.location || '',
      ip_address: deviceData?.ip_address || lead.ip_address || '',
      browser: deviceData?.browser || lead.browser || '',
      os: deviceData?.os || lead.os || '',
      device_type: deviceData?.device_type || lead.device_type || '',
      device_model: deviceData?.device_model || lead.device_model || '',
      tracking_method: lead.tracking_method || 'direct',
      ad_account: lead.ad_account || '',
      ad_set_name: lead.ad_set_name || '',
      ad_name: lead.ad_name || '',
      initial_message: lead.initial_message || '',
      country: deviceData?.country || lead.country || '',
      city: deviceData?.city || lead.city || '',
      screen_resolution: deviceData?.screen_resolution || lead.screen_resolution || '',
      timezone: deviceData?.timezone || lead.timezone || '',
      language: deviceData?.language || lead.language || '',
      // 🎯 INCLUIR DADOS DO FACEBOOK ADS SE DISPONÍVEIS
      facebook_ad_id: deviceData?.facebook_ad_id || lead.facebook_ad_id || '',
      facebook_adset_id: deviceData?.facebook_adset_id || lead.facebook_adset_id || '',
      facebook_campaign_id: deviceData?.facebook_campaign_id || lead.facebook_campaign_id || '',
      // 🆕 INCLUIR USER_ID
      user_id: lead.user_id || user.id
    };

    console.log('💾 Dados que serão inseridos no lead (com user_id):', {
      nome: leadData.name,
      telefone: leadData.phone,
      user_id: leadData.user_id,
      device_type: leadData.device_type,
      browser: leadData.browser,
      location: leadData.location,
      ip_address: leadData.ip_address,
      facebook_ad_id: leadData.facebook_ad_id,
      facebook_adset_id: leadData.facebook_adset_id,
      facebook_campaign_id: leadData.facebook_campaign_id,
      tem_dados_dispositivo: !!deviceData
    });

    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Lead criado com sucesso com user_id:', {
      id: data.id,
      name: data.name,
      user_id: data.user_id,
      device_type: data.device_type,
      location: data.location,
      facebook_ad_id: data.facebook_ad_id,
      facebook_campaign_id: data.facebook_campaign_id
    });

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as Lead['status'],
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message || null,
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      utm_term: data.utm_term || '',
      // Campos existentes
      location: data.location || '',
      ip_address: data.ip_address || '',
      browser: data.browser || '',
      os: data.os || '',
      device_type: data.device_type || '',
      device_model: data.device_model || '',
      tracking_method: data.tracking_method || 'direct',
      ad_account: data.ad_account || '',
      ad_set_name: data.ad_set_name || '',
      ad_name: data.ad_name || '',
      initial_message: data.initial_message || '',
      country: data.country || '',
      city: data.city || '',
      screen_resolution: data.screen_resolution || '',
      timezone: data.timezone || '',
      language: data.language || '',
      // 🎯 NOVOS CAMPOS DO FACEBOOK ADS
      facebook_ad_id: data.facebook_ad_id || '',
      facebook_adset_id: data.facebook_adset_id || '',
      facebook_campaign_id: data.facebook_campaign_id || '',
      user_id: data.user_id
    };
  } catch (error) {
    console.error("Error adding lead:", error);
    throw error;
  }
};

export const updateLead = async (id: string, lead: Partial<Lead>): Promise<Lead> => {
  try {
    // Prepare the update data
    const updateData: any = {};
    if (lead.name) updateData.name = lead.name;
    if (lead.phone) updateData.phone = lead.phone;
    if (lead.campaign) updateData.campaign = lead.campaign;
    if (lead.status) updateData.status = lead.status;
    if (lead.custom_fields) updateData.custom_fields = lead.custom_fields;
    if (lead.notes !== undefined) updateData.notes = lead.notes;
    if (lead.first_contact_date !== undefined) updateData.first_contact_date = lead.first_contact_date;
    if (lead.last_contact_date !== undefined) updateData.last_contact_date = lead.last_contact_date;
    if (lead.last_message !== undefined) updateData.last_message = lead.last_message;
    if (lead.utm_source !== undefined) updateData.utm_source = lead.utm_source;
    if (lead.utm_medium !== undefined) updateData.utm_medium = lead.utm_medium;
    if (lead.utm_campaign !== undefined) updateData.utm_campaign = lead.utm_campaign;
    if (lead.utm_content !== undefined) updateData.utm_content = lead.utm_content;
    if (lead.utm_term !== undefined) updateData.utm_term = lead.utm_term;
    // Campos existentes
    if (lead.location !== undefined) updateData.location = lead.location;
    if (lead.ip_address !== undefined) updateData.ip_address = lead.ip_address;
    if (lead.browser !== undefined) updateData.browser = lead.browser;
    if (lead.os !== undefined) updateData.os = lead.os;
    if (lead.device_type !== undefined) updateData.device_type = lead.device_type;
    if (lead.device_model !== undefined) updateData.device_model = lead.device_model;
    if (lead.tracking_method !== undefined) updateData.tracking_method = lead.tracking_method;
    if (lead.ad_account !== undefined) updateData.ad_account = lead.ad_account;
    if (lead.ad_set_name !== undefined) updateData.ad_set_name = lead.ad_set_name;
    if (lead.ad_name !== undefined) updateData.ad_name = lead.ad_name;
    if (lead.initial_message !== undefined) updateData.initial_message = lead.initial_message;
    if (lead.country !== undefined) updateData.country = lead.country;
    if (lead.city !== undefined) updateData.city = lead.city;
    if (lead.screen_resolution !== undefined) updateData.screen_resolution = lead.screen_resolution;
    if (lead.timezone !== undefined) updateData.timezone = lead.timezone;
    if (lead.language !== undefined) updateData.language = lead.language;
    // 🎯 NOVOS CAMPOS DO FACEBOOK ADS
    if (lead.facebook_ad_id !== undefined) updateData.facebook_ad_id = lead.facebook_ad_id;
    if (lead.facebook_adset_id !== undefined) updateData.facebook_adset_id = lead.facebook_adset_id;
    if (lead.facebook_campaign_id !== undefined) updateData.facebook_campaign_id = lead.facebook_campaign_id;
    if (lead.user_id !== undefined) updateData.user_id = lead.user_id;
    if ((lead as any).current_stage_id !== undefined) updateData.current_stage_id = (lead as any).current_stage_id;
    if ((lead as any).agent_id !== undefined) updateData.agent_id = (lead as any).agent_id;
    if ((lead as any).collected_variables !== undefined) updateData.collected_variables = (lead as any).collected_variables;

    // Update lead in Supabase
    const { data: updatedData, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const data = updatedData as any;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as Lead['status'],
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message || null,
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      utm_term: data.utm_term || '',
      // Campos existentes
      location: data.location || '',
      ip_address: data.ip_address || '',
      browser: data.browser || '',
      os: data.os || '',
      device_type: data.device_type || '',
      device_model: data.device_model || '',
      tracking_method: data.tracking_method || 'direct',
      ad_account: data.ad_account || '',
      ad_set_name: data.ad_set_name || '',
      ad_name: data.ad_name || '',
      initial_message: data.initial_message || '',
      country: data.country || '',
      city: data.city || '',
      screen_resolution: data.screen_resolution || '',
      timezone: data.timezone || '',
      language: data.language || '',
      // 🎯 NOVOS CAMPOS DO FACEBOOK ADS
      facebook_ad_id: data.facebook_ad_id || '',
      facebook_adset_id: data.facebook_adset_id || '',
      facebook_campaign_id: data.facebook_campaign_id || '',
      user_id: data.user_id
    };
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
};
