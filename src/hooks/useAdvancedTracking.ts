
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types/campaign';

interface UserData {
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
  fbc?: string; // Facebook click ID
  fbp?: string; // Facebook browser ID
  sourceUrl?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  campaign_id?: string;
  lead_id?: string;
  source_url?: string;
}

interface ConversionsAPIResponse {
  success: boolean;
  result?: any;
  event_name?: string;
  events_received?: number;
  error?: string;
  details?: any;
}

export const useAdvancedTracking = () => {
  
  // Get Facebook click and browser IDs from cookies/localStorage
  const getFacebookIds = (): { fbc?: string; fbp?: string } => {
    const fbc = localStorage.getItem('_fbc') || undefined;
    const fbp = localStorage.getItem('_fbp') || undefined;
    return { fbc, fbp };
  };

  // Get client IP (simplified - in production you might want a more robust solution)
  const getClientData = (): { clientIp?: string; userAgent: string; sourceUrl: string } => {
    return {
      userAgent: navigator.userAgent,
      sourceUrl: window.location.href
    };
  };

  // Calculate lead score based on various factors
  const calculateLeadScore = (userData: UserData, campaign: Campaign): number => {
    let score = 0;
    
    // Base score
    score += 10;
    
    // Email provided
    if (userData.email) score += 25;
    
    // Phone provided
    if (userData.phone) score += 20;
    
    // Complete name
    if (userData.firstName && userData.lastName) score += 15;
    
    // Location data
    if (userData.city) score += 10;
    if (userData.state) score += 5;
    if (userData.zipCode) score += 10;
    
    // Campaign source quality
    if (campaign.utm_source === 'facebook') score += 5;
    if (campaign.utm_source === 'instagram') score += 3;
    
    // Event type importance
    if (campaign.event_type === 'lead') score += 15;
    if (campaign.event_type === 'contact') score += 10;
    
    return Math.min(score, 100); // Cap at 100
  };

  // Send event to Conversions API
  const sendConversionEvent = async (
    eventName: string,
    campaign: Campaign,
    userData: UserData = {},
    customData: CustomData = {}
  ): Promise<ConversionsAPIResponse> => {
    try {
      if (!campaign.pixel_id) {
        console.warn('No pixel ID found for campaign:', campaign.name);
        return { success: false, error: 'No pixel ID configured' };
      }

      // Get Facebook access token from campaign or fallback to localStorage
      const accessToken = campaign.facebook_access_token || localStorage.getItem('facebook_access_token');
      if (!accessToken) {
        console.warn('No Facebook access token configured for campaign:', campaign.name);
        return { success: false, error: 'No access token configured' };
      }

      // Collect all user data
      const facebookIds = getFacebookIds();
      const clientData = getClientData();
      
      const enrichedUserData: UserData = {
        ...userData,
        ...facebookIds,
        ...clientData,
        country: userData.country || 'BR' // Default to Brazil
      };

      // Enrich custom data
      const enrichedCustomData: CustomData = {
        currency: 'BRL',
        ...customData,
        campaign_id: campaign.id,
        content_name: campaign.name,
        content_category: campaign.utm_medium || 'marketing',
        source_url: window.location.href
      };

      console.log('Sending Conversion Event:', {
        eventName,
        campaign: campaign.name,
        pixelId: campaign.pixel_id
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('facebook-conversions', {
        body: {
          pixelId: campaign.pixel_id,
          accessToken,
          eventName,
          userData: enrichedUserData,
          customData: enrichedCustomData,
          testEventCode: process.env.NODE_ENV === 'development' ? 'TEST123' : undefined
        }
      });

      if (error) {
        console.error('Conversions API error:', error);
        return { success: false, error: error.message };
      }

      console.log('Conversions API success:', data);
      return data as ConversionsAPIResponse;

    } catch (error) {
      console.error('Advanced tracking error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Enhanced lead tracking with server-side events
  const trackLeadWithConversions = async (
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
  ): Promise<{ score: number; conversionResult: ConversionsAPIResponse }> => {
    
    // Parse name into first and last name
    const nameParts = leadData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const userData: UserData = {
      email: leadData.email,
      phone: leadData.phone,
      firstName,
      lastName,
      city: leadData.city,
      state: leadData.state,
      zipCode: leadData.zipCode
    };

    // Calculate lead score
    const score = calculateLeadScore(userData, campaign);
    
    // Send conversion event
    const conversionResult = await sendConversionEvent(
      'Lead',
      campaign,
      userData,
      {
        lead_id: leadId,
        value: score, // Use lead score as value
        content_ids: [campaign.id]
      }
    );

    return { score, conversionResult };
  };

  // Track page view with enhanced data
  const trackPageViewWithConversions = async (campaign: Campaign): Promise<ConversionsAPIResponse> => {
    return sendConversionEvent(
      'PageView',
      campaign,
      {},
      {
        content_name: `${campaign.name} - Landing Page`,
        source_url: window.location.href
      }
    );
  };

  // Track form start
  const trackFormStartWithConversions = async (campaign: Campaign): Promise<ConversionsAPIResponse> => {
    return sendConversionEvent(
      'InitiateCheckout',
      campaign,
      {},
      {
        content_name: `${campaign.name} - Form Started`,
        source_url: window.location.href
      }
    );
  };

  return {
    sendConversionEvent,
    trackLeadWithConversions,
    trackPageViewWithConversions,
    trackFormStartWithConversions,
    calculateLeadScore,
    getFacebookIds,
    getClientData
  };
};
