
export interface Campaign {
  id: string;
  name: string;
  pixel_id?: string;
  facebook_access_token?: string;
  whatsapp_number?: string;
  event_type?: 'contact' | 'lead' | 'page_view' | 'sale';
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
  redirect_type?: 'whatsapp' | 'form';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  active?: boolean;
  created_at?: string;
  pixel_integration_type?: 'direct' | 'form';
  conversion_keywords?: string[];
  cancellation_keywords?: string[];
  conversion_api_enabled?: boolean;
  test_event_code?: string;
  advanced_matching_enabled?: boolean;
  custom_audience_pixel_id?: string;
  server_side_api_enabled?: boolean;
  tracking_domain?: string;
  external_id?: string;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface CompanyBranding {
  logo: string;
  title: string;
  subtitle: string;
}

export interface AdvancedTrackingParams {
  conversion_api_enabled: boolean;
  advanced_matching_enabled: boolean;
  server_side_api_enabled: boolean;
  test_event_code?: string;
  custom_audience_pixel_id?: string;
  tracking_domain?: string;
  external_id?: string;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}
