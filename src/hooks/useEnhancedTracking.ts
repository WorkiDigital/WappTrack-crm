
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types/campaign';

interface EnhancedUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientIp?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  sourceUrl?: string;
  referrer?: string;
  timeOnPage?: number;
  scrollDepth?: number;
  deviceType?: string;
  browserName?: string;
  operatingSystem?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  connectionType?: string;
  pageLoadTime?: number;
  sessionId?: string;
  visitorId?: string;
  externalId?: string;
}

interface EnhancedCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  campaign_id?: string;
  lead_id?: string;
  source_url?: string;
  num_items?: number;
  search_string?: string;
  content_type?: string;
  predicted_ltv?: number;
  custom_properties?: Record<string, any>;
}

export const useEnhancedTracking = () => {
  
  // Collect comprehensive user data
  const getEnhancedUserData = (): EnhancedUserData => {
    const fbc = localStorage.getItem('_fbc') || undefined;
    const fbp = localStorage.getItem('_fbp') || undefined;
    
    // Detect device type
    const getDeviceType = (): string => {
      const userAgent = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
      if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
      return 'desktop';
    };

    // Detect browser
    const getBrowserName = (): string => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    };

    // Detect OS
    const getOperatingSystem = (): string => {
      const userAgent = navigator.userAgent;
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    };

    // Connection type detection
    const getConnectionType = (): string => {
      // @ts-ignore - experimental API
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return connection?.effectiveType || 'unknown';
    };

    return {
      fbc,
      fbp,
      userAgent: navigator.userAgent,
      sourceUrl: window.location.href,
      referrer: document.referrer,
      deviceType: getDeviceType(),
      browserName: getBrowserName(),
      operatingSystem: getOperatingSystem(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      connectionType: getConnectionType(),
      sessionId: sessionStorage.getItem('session_id') || generateSessionId(),
      visitorId: localStorage.getItem('visitor_id') || generateVisitorId()
    };
  };

  // Generate unique session ID
  const generateSessionId = (): string => {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('session_id', sessionId);
    return sessionId;
  };

  // Generate unique visitor ID
  const generateVisitorId = (): string => {
    const visitorId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visitor_id', visitorId);
    return visitorId;
  };

  // Track page engagement metrics
  const trackPageEngagement = (): { timeOnPage: number; scrollDepth: number } => {
    const startTime = performance.now();
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    const timeOnPage = Math.round((performance.now() - startTime) / 1000);
    
    return { timeOnPage, scrollDepth };
  };

  // Enhanced conversion event with maximum parameters
  const sendEnhancedConversionEvent = async (
    eventName: string,
    campaign: Campaign,
    userData: Partial<EnhancedUserData> = {},
    customData: Partial<EnhancedCustomData> = {}
  ) => {
    try {
      if (!campaign.pixel_id) {
        console.warn('No pixel ID found for campaign:', campaign.name);
        return { success: false, error: 'No pixel ID configured' };
      }

      const accessToken = campaign.facebook_access_token || localStorage.getItem('facebook_access_token');
      if (!accessToken) {
        console.warn('No Facebook access token configured');
        return { success: false, error: 'No access token configured' };
      }

      // Collect all enhanced user data
      const enhancedUserData = {
        ...getEnhancedUserData(),
        ...userData,
        ...trackPageEngagement(),
        country: userData.country || 'BR'
      };

      // Enhanced custom data with more parameters
      const enhancedCustomData: EnhancedCustomData = {
        currency: 'BRL',
        ...customData,
        campaign_id: campaign.id,
        content_name: campaign.name,
        content_category: campaign.utm_medium || 'marketing',
        source_url: window.location.href,
        content_type: campaign.event_type || 'lead',
        custom_properties: {
          campaign_utm_source: campaign.utm_source,
          campaign_utm_medium: campaign.utm_medium,
          campaign_utm_campaign: campaign.utm_campaign,
          campaign_utm_content: campaign.utm_content,
          campaign_utm_term: campaign.utm_term,
          redirect_type: campaign.redirect_type,
          pixel_integration_type: campaign.pixel_integration_type,
          tracking_domain: campaign.tracking_domain,
          external_id: campaign.external_id || enhancedUserData.externalId
        }
      };

      console.log('Sending Enhanced Conversion Event with maximum parameters:', {
        eventName,
        campaign: campaign.name,
        pixelId: campaign.pixel_id,
        parametersCount: Object.keys({...enhancedUserData, ...enhancedCustomData}).length
      });

      // Send via Conversions API
      const { data, error } = await supabase.functions.invoke('facebook-conversions', {
        body: {
          pixelId: campaign.pixel_id,
          accessToken,
          eventName,
          userData: enhancedUserData,
          customData: enhancedCustomData,
          testEventCode: campaign.test_event_code || (process.env.NODE_ENV === 'development' ? 'TEST123' : undefined),
          dataProcessingOptions: campaign.data_processing_options || [],
          dataProcessingOptionsCountry: campaign.data_processing_options_country || 0,
          dataProcessingOptionsState: campaign.data_processing_options_state || 0
        }
      });

      if (error) {
        console.error('Enhanced Conversions API error:', error);
        return { success: false, error: error.message };
      }

      console.log('Enhanced Conversions API success with', Object.keys({...enhancedUserData, ...enhancedCustomData}).length, 'parameters:', data);
      return data;

    } catch (error) {
      console.error('Enhanced tracking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Enhanced lead tracking with comprehensive data
  const trackEnhancedLead = async (
    campaign: Campaign,
    leadData: {
      name: string;
      phone: string;
      email?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    },
    leadId?: string
  ) => {
    const nameParts = leadData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData: Partial<EnhancedUserData> = {
      email: leadData.email,
      phone: leadData.phone,
      firstName,
      lastName,
      city: leadData.city,
      state: leadData.state,
      zipCode: leadData.zipCode,
      externalId: campaign.external_id
    };

    const customData: Partial<EnhancedCustomData> = {
      lead_id: leadId,
      value: 100, // Default lead value
      content_ids: [campaign.id],
      num_items: 1,
      predicted_ltv: 500 // Predicted lifetime value
    };

    return sendEnhancedConversionEvent('Lead', campaign, userData, customData);
  };

  // Enhanced page view tracking
  const trackEnhancedPageView = async (campaign: Campaign) => {
    const customData: Partial<EnhancedCustomData> = {
      content_name: `${campaign.name} - Landing Page`,
      source_url: window.location.href,
      content_type: 'page_view'
    };

    return sendEnhancedConversionEvent('PageView', campaign, {}, customData);
  };

  return {
    sendEnhancedConversionEvent,
    trackEnhancedLead,
    trackEnhancedPageView,
    getEnhancedUserData,
    trackPageEngagement,
    generateSessionId,
    generateVisitorId
  };
};
