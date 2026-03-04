import { Campaign } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (campaigns || []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      pixel_id: campaign.pixel_id || "",
      facebook_access_token: campaign.facebook_access_token || "",
      whatsapp_number: campaign.whatsapp_number || "",
      event_type: (campaign.event_type as "lead" | "contact" | "page_view" | "sale") || "lead",
      custom_message: campaign.custom_message || "",
      company_title: campaign.company_name || "",
      company_subtitle: campaign.company_subtitle || "",
      logo_url: "", // Logo is handled separately in company settings
      redirect_type: (campaign.redirect_type as "whatsapp" | "form") || "whatsapp",
      utm_source: campaign.utm_source || "",
      utm_medium: campaign.utm_medium || "",
      utm_campaign: campaign.utm_campaign || "",
      utm_content: campaign.utm_content || "",
      utm_term: campaign.utm_term || "",
      active: campaign.active ?? true,
      created_at: campaign.created_at,
      pixel_integration_type: (campaign.pixel_integration_type as "direct" | "form") || "direct",
      conversion_keywords: campaign.conversion_keywords || [],
      cancellation_keywords: campaign.cancellation_keywords || [],
      conversion_api_enabled: campaign.conversion_api_enabled || false,
      test_event_code: campaign.test_event_code || "",
      advanced_matching_enabled: campaign.advanced_matching_enabled || false,
      custom_audience_pixel_id: campaign.custom_audience_pixel_id || "",
      server_side_api_enabled: campaign.server_side_api_enabled || false,
      tracking_domain: campaign.tracking_domain || "",
      external_id: campaign.external_id || "",
      data_processing_options: campaign.data_processing_options || [],
      data_processing_options_country: campaign.data_processing_options_country || 0,
      data_processing_options_state: campaign.data_processing_options_state || 0,
      user_id: campaign.user_id,
    }));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
};

export const addCampaign = async (
  campaign: Omit<Campaign, "id" | "created_at">
): Promise<Campaign> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        name: campaign.name,
        pixel_id: campaign.pixel_id,
        facebook_access_token: campaign.facebook_access_token,
        whatsapp_number: campaign.whatsapp_number,
        event_type: campaign.event_type,
        custom_message: campaign.custom_message,
        company_name: campaign.company_title,
        company_subtitle: campaign.company_subtitle,
        redirect_type: campaign.redirect_type,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        active: campaign.active,
        pixel_integration_type: campaign.pixel_integration_type,
        conversion_keywords: campaign.conversion_keywords,
        cancellation_keywords: campaign.cancellation_keywords,
        conversion_api_enabled: campaign.conversion_api_enabled,
        test_event_code: campaign.test_event_code,
        advanced_matching_enabled: campaign.advanced_matching_enabled,
        custom_audience_pixel_id: campaign.custom_audience_pixel_id,
        server_side_api_enabled: campaign.server_side_api_enabled,
        tracking_domain: campaign.tracking_domain,
        external_id: campaign.external_id,
        data_processing_options: campaign.data_processing_options,
        data_processing_options_country: campaign.data_processing_options_country,
        data_processing_options_state: campaign.data_processing_options_state,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pixel_id: data.pixel_id || "",
      facebook_access_token: data.facebook_access_token || "",
      whatsapp_number: data.whatsapp_number || "",
      event_type: (data.event_type as "lead" | "contact" | "page_view" | "sale") || "lead",
      custom_message: data.custom_message || "",
      company_title: data.company_name || "",
      company_subtitle: data.company_subtitle || "",
      logo_url: "", // Logo is handled separately in company settings
      redirect_type: (data.redirect_type as "whatsapp" | "form") || "whatsapp",
      utm_source: data.utm_source || "",
      utm_medium: data.utm_medium || "",
      utm_campaign: data.utm_campaign || "",
      utm_content: data.utm_content || "",
      utm_term: data.utm_term || "",
      active: data.active ?? true,
      created_at: data.created_at,
      pixel_integration_type: (data.pixel_integration_type as "direct" | "form") || "direct",
      conversion_keywords: data.conversion_keywords || [],
      cancellation_keywords: data.cancellation_keywords || [],
      conversion_api_enabled: data.conversion_api_enabled || false,
      test_event_code: data.test_event_code || "",
      advanced_matching_enabled: data.advanced_matching_enabled || false,
      custom_audience_pixel_id: data.custom_audience_pixel_id || "",
      server_side_api_enabled: data.server_side_api_enabled || false,
      tracking_domain: data.tracking_domain || "",
      external_id: data.external_id || "",
      data_processing_options: data.data_processing_options || [],
      data_processing_options_country: data.data_processing_options_country || 0,
      data_processing_options_state: data.data_processing_options_state || 0,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error("Error adding campaign:", error);
    throw error;
  }
};

export const updateCampaign = async (
  id: string,
  campaign: Partial<Campaign>
): Promise<Campaign> => {
  try {
    const updateData: any = {};
    if (campaign.name !== undefined) updateData.name = campaign.name;
    if (campaign.pixel_id !== undefined) updateData.pixel_id = campaign.pixel_id;
    if (campaign.facebook_access_token !== undefined)
      updateData.facebook_access_token = campaign.facebook_access_token;
    if (campaign.whatsapp_number !== undefined)
      updateData.whatsapp_number = campaign.whatsapp_number;
    if (campaign.event_type !== undefined) updateData.event_type = campaign.event_type;
    if (campaign.custom_message !== undefined) updateData.custom_message = campaign.custom_message;
    if (campaign.company_title !== undefined) updateData.company_name = campaign.company_title;
    if (campaign.company_subtitle !== undefined) updateData.company_subtitle = campaign.company_subtitle;
    if (campaign.redirect_type !== undefined)
      updateData.redirect_type = campaign.redirect_type;
    if (campaign.utm_source !== undefined)
      updateData.utm_source = campaign.utm_source;
    if (campaign.utm_medium !== undefined)
      updateData.utm_medium = campaign.utm_medium;
    if (campaign.utm_campaign !== undefined)
      updateData.utm_campaign = campaign.utm_campaign;
    if (campaign.utm_content !== undefined)
      updateData.utm_content = campaign.utm_content;
    if (campaign.utm_term !== undefined) updateData.utm_term = campaign.utm_term;
    if (campaign.active !== undefined) updateData.active = campaign.active;
    if (campaign.pixel_integration_type !== undefined)
      updateData.pixel_integration_type = campaign.pixel_integration_type;
    if (campaign.conversion_keywords !== undefined)
      updateData.conversion_keywords = campaign.conversion_keywords;
    if (campaign.cancellation_keywords !== undefined)
      updateData.cancellation_keywords = campaign.cancellation_keywords;
    if (campaign.conversion_api_enabled !== undefined)
      updateData.conversion_api_enabled = campaign.conversion_api_enabled;
    if (campaign.test_event_code !== undefined)
      updateData.test_event_code = campaign.test_event_code;
    if (campaign.advanced_matching_enabled !== undefined)
      updateData.advanced_matching_enabled = campaign.advanced_matching_enabled;
    if (campaign.custom_audience_pixel_id !== undefined)
      updateData.custom_audience_pixel_id = campaign.custom_audience_pixel_id;
    if (campaign.server_side_api_enabled !== undefined)
      updateData.server_side_api_enabled = campaign.server_side_api_enabled;
    if (campaign.tracking_domain !== undefined)
      updateData.tracking_domain = campaign.tracking_domain;
    if (campaign.external_id !== undefined)
      updateData.external_id = campaign.external_id;
    if (campaign.data_processing_options !== undefined)
      updateData.data_processing_options = campaign.data_processing_options;
    if (campaign.data_processing_options_country !== undefined)
      updateData.data_processing_options_country = campaign.data_processing_options_country;
    if (campaign.data_processing_options_state !== undefined)
      updateData.data_processing_options_state = campaign.data_processing_options_state;

    const { data, error } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pixel_id: data.pixel_id || "",
      facebook_access_token: data.facebook_access_token || "",
      whatsapp_number: data.whatsapp_number || "",
      event_type: (data.event_type as "lead" | "contact" | "page_view" | "sale") || "lead",
      custom_message: data.custom_message || "",
      company_title: data.company_name || "",
      company_subtitle: data.company_subtitle || "",
      logo_url: "", // Logo is handled separately in company settings
      redirect_type: (data.redirect_type as "whatsapp" | "form") || "whatsapp",
      utm_source: data.utm_source || "",
      utm_medium: data.utm_medium || "",
      utm_campaign: data.utm_campaign || "",
      utm_content: data.utm_content || "",
      utm_term: data.utm_term || "",
      active: data.active ?? true,
      created_at: data.created_at,
      pixel_integration_type: (data.pixel_integration_type as "direct" | "form") || "direct",
      conversion_keywords: data.conversion_keywords || [],
      cancellation_keywords: data.cancellation_keywords || [],
      conversion_api_enabled: data.conversion_api_enabled || false,
      test_event_code: data.test_event_code || "",
      advanced_matching_enabled: data.advanced_matching_enabled || false,
      custom_audience_pixel_id: data.custom_audience_pixel_id || "",
      server_side_api_enabled: data.server_side_api_enabled || false,
      tracking_domain: data.tracking_domain || "",
      external_id: data.external_id || "",
      data_processing_options: data.data_processing_options || [],
      data_processing_options_country: data.data_processing_options_country || 0,
      data_processing_options_state: data.data_processing_options_state || 0,
      user_id: data.user_id,
    };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
};
