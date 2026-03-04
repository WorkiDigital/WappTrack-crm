
import { Sale } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getSales = async (): Promise<Sale[]> => {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false });

    if (error) throw error;

    // 🆕 MAPEAR DADOS EXPANDIDOS DAS VENDAS
    return (sales || []).map(sale => {
      // Type guard for custom_fields
      const customFields = sale.custom_fields && typeof sale.custom_fields === 'object' 
        ? sale.custom_fields as Record<string, any>
        : {};
      
      const leadData = customFields.lead_data && typeof customFields.lead_data === 'object'
        ? customFields.lead_data as Record<string, any>
        : {};

      return {
        id: sale.id,
        value: sale.amount || 0,
        date: sale.sale_date || sale.created_at,
        lead_name: '', // This needs to be populated from leads table if needed
        campaign: sale.campaign_id || '',
        product: '',
        notes: sale.notes || '',
        lead_id: sale.lead_id || '',
        status: (sale.status as 'confirmed' | 'pending' | 'cancelled') || 'confirmed',
        created_at: sale.created_at,
        updated_at: sale.updated_at,
        // 🆕 INCLUIR CAMPOS PRESERVADOS DO LEAD
        custom_fields: customFields,
        utm_source: leadData.utm_source || '',
        utm_medium: leadData.utm_medium || '',
        utm_campaign: leadData.utm_campaign || '',
        utm_content: leadData.utm_content || '',
        utm_term: leadData.utm_term || '',
        ad_account: leadData.ad_account || '',
        ad_set_name: leadData.ad_set_name || '',
        ad_name: leadData.ad_name || '',
        tracking_method: leadData.tracking_method || '',
        device_type: leadData.device_type || '',
        location: leadData.location || ''
      };
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>): Promise<Sale> => {
  try {
    // 🆕 PREPARAR DADOS COM CAMPOS EXPANDIDOS
    const saleData = {
      amount: sale.value,
      sale_date: sale.date,
      status: sale.status || 'confirmed',
      notes: sale.notes,
      lead_id: sale.lead_id || null,
      campaign_id: sale.campaign || null,
      // 🆕 PRESERVAR CUSTOM_FIELDS COM DADOS DO LEAD
      custom_fields: sale.custom_fields || {}
    };

    console.log('💾 [SALE SERVICE] Criando venda com dados expandidos:', saleData);

    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (error) throw error;

    // Type guard for custom_fields from response
    const customFields = data.custom_fields && typeof data.custom_fields === 'object' 
      ? data.custom_fields as Record<string, any>
      : {};

    return {
      id: data.id,
      value: data.amount,
      date: data.sale_date,
      lead_name: sale.lead_name || '',
      campaign: sale.campaign || '',
      product: sale.product || '',
      notes: data.notes,
      lead_id: data.lead_id,
      status: (data.status as 'confirmed' | 'pending' | 'cancelled') || 'confirmed',
      created_at: data.created_at,
      updated_at: data.updated_at,
      // 🆕 INCLUIR CAMPOS PRESERVADOS
      custom_fields: customFields,
      utm_source: sale.utm_source || '',
      utm_medium: sale.utm_medium || '',
      utm_campaign: sale.utm_campaign || '',
      utm_content: sale.utm_content || '',
      utm_term: sale.utm_term || '',
      ad_account: sale.ad_account || '',
      ad_set_name: sale.ad_set_name || '',
      ad_name: sale.ad_name || '',
      tracking_method: sale.tracking_method || '',
      device_type: sale.device_type || '',
      location: sale.location || ''
    };
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  try {
    const updateData: any = {};
    if (sale.value !== undefined) updateData.amount = sale.value;
    if (sale.date !== undefined) updateData.sale_date = sale.date;
    if (sale.status !== undefined) updateData.status = sale.status;
    if (sale.notes !== undefined) updateData.notes = sale.notes;
    if (sale.lead_id !== undefined) updateData.lead_id = sale.lead_id;
    if (sale.campaign !== undefined) updateData.campaign_id = sale.campaign;
    if (sale.custom_fields !== undefined) updateData.custom_fields = sale.custom_fields;

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Type guard for custom_fields from response
    const customFields = data.custom_fields && typeof data.custom_fields === 'object' 
      ? data.custom_fields as Record<string, any>
      : {};
    
    const leadData = customFields.lead_data && typeof customFields.lead_data === 'object'
      ? customFields.lead_data as Record<string, any>
      : {};

    return {
      id: data.id,
      value: data.amount,
      date: data.sale_date,
      lead_name: sale.lead_name || '',
      campaign: sale.campaign || '',
      product: sale.product || '',
      notes: data.notes,
      lead_id: data.lead_id,
      status: (data.status as 'confirmed' | 'pending' | 'cancelled') || 'confirmed',
      created_at: data.created_at,
      updated_at: data.updated_at,
      custom_fields: customFields,
      utm_source: leadData.utm_source || '',
      utm_medium: leadData.utm_medium || '',
      utm_campaign: leadData.utm_campaign || '',
      utm_content: leadData.utm_content || '',
      utm_term: leadData.utm_term || '',
      ad_account: leadData.ad_account || '',
      ad_set_name: leadData.ad_set_name || '',
      ad_name: leadData.ad_name || '',
      tracking_method: leadData.tracking_method || '',
      device_type: leadData.device_type || '',
      location: leadData.location || ''
    };
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};
