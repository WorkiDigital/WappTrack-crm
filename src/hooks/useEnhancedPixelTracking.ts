
import { useEffect } from 'react';
import { Campaign } from '@/types';
import { initFacebookPixel, trackPageView } from '@/lib/fbPixel';
import { useMaximumTracking } from './useMaximumTracking';
import { supabase } from '@/integrations/supabase/client';

// Facebook Advanced Matching user data interface
interface FacebookUserData {
  em?: string[];      // hashed email
  ph?: string[];      // hashed phone
  fn?: string[];      // hashed first name
  ln?: string[];      // hashed last name
  ct?: string[];      // hashed city
  st?: string[];      // hashed state
  zp?: string[];      // hashed zip
  country?: string[]; // hashed country
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;       // Facebook click ID
  fbp?: string;       // Facebook browser ID
}

export const useEnhancedPixelTracking = (
  campaign: Campaign | null,
  debug: boolean = false
) => {
  const { trackingData, getEnrichedEventData, logTrackingSummary, isReady } = useMaximumTracking(campaign);

  useEffect(() => {
    if (!campaign?.pixel_id || !isReady) return;

    console.log('🎯 Inicializando Facebook Pixel com tracking avançado...');
    
    // Initialize Facebook Pixel
    const pixelInitialized = initFacebookPixel(campaign.pixel_id, debug);
    
    if (pixelInitialized) {
      console.log('✅ Facebook Pixel inicializado com sucesso');
      
      // Track enhanced page view
      trackEnhancedPageView();
      
      // Log tracking summary
      logTrackingSummary();
    }
  }, [campaign, isReady, debug]);

  const trackEnhancedPageView = async () => {
    if (!campaign || !window.fbq) return;

    try {
      const enrichedData = getEnrichedEventData({
        event_type: 'page_view',
        content_type: 'page_view'
      });

      console.log('📊 Tracking enhanced PageView with data:', {
        parametersCount: Object.keys(enrichedData.custom_data).length,
        userDataCount: Object.keys(enrichedData.user_data).length
      });

      // Track client-side PageView with enriched data
      window.fbq('track', 'PageView', enrichedData.custom_data);

      // Also send via Conversions API for server-side tracking
      if (campaign.conversion_api_enabled) {
        await sendServerSideEvent('PageView', enrichedData);
      }

    } catch (error) {
      console.error('❌ Error tracking enhanced PageView:', error);
    }
  };

  const trackEnhancedLead = async (leadData: {
    name: string;
    phone: string;
    email?: string;
    value?: number;
  }) => {
    if (!campaign || !window.fbq) return;

    try {
      // Parse name for advanced matching
      const nameParts = leadData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const enrichedData = getEnrichedEventData({
        event_type: 'lead',
        content_type: 'lead',
        value: leadData.value || 100,
        lead_name: leadData.name,
        lead_phone: leadData.phone,
        lead_email: leadData.email
      });

      // Create properly typed advanced matching data
      const advancedMatchingData: FacebookUserData = {
        // Include existing Facebook data
        fbc: enrichedData.user_data.fbc,
        fbp: enrichedData.user_data.fbp,
        client_ip_address: enrichedData.user_data.client_ip_address,
        client_user_agent: enrichedData.user_data.client_user_agent,
        // Add lead-specific hashed data
        ...(leadData.email && { em: [await hashData(leadData.email)] }),
        ...(leadData.phone && { ph: [await hashData(normalizePhone(leadData.phone))] }),
        ...(firstName && { fn: [await hashData(firstName)] }),
        ...(lastName && { ln: [await hashData(lastName)] })
      };

      console.log('🎯 Tracking enhanced Lead with advanced matching:', {
        parametersCount: Object.keys(enrichedData.custom_data).length,
        userDataCount: Object.keys(advancedMatchingData).length,
        hasAdvancedMatching: !!(leadData.email || leadData.phone)
      });

      // Track client-side Lead with enriched data
      window.fbq('track', 'Lead', enrichedData.custom_data);

      // Send via Conversions API for server-side tracking
      if (campaign.conversion_api_enabled) {
        await sendServerSideEvent('Lead', {
          ...enrichedData,
          user_data: advancedMatchingData
        });
      }

    } catch (error) {
      console.error('❌ Error tracking enhanced Lead:', error);
    }
  };

  const trackEnhancedCustomEvent = async (eventName: string, customData?: any) => {
    if (!campaign || !window.fbq) return;

    try {
      const enrichedData = getEnrichedEventData({
        event_type: eventName.toLowerCase(),
        content_type: eventName.toLowerCase(),
        ...customData
      });

      console.log(`🔥 Tracking enhanced ${eventName}:`, {
        parametersCount: Object.keys(enrichedData.custom_data).length
      });

      // Track client-side custom event
      window.fbq('trackCustom', eventName, enrichedData.custom_data);

      // Send via Conversions API if enabled
      if (campaign.conversion_api_enabled) {
        await sendServerSideEvent(eventName, enrichedData);
      }

    } catch (error) {
      console.error(`❌ Error tracking enhanced ${eventName}:`, error);
    }
  };

  const sendServerSideEvent = async (eventName: string, enrichedData: any) => {
    try {
      if (!campaign?.facebook_access_token) {
        console.warn('⚠️ No Facebook access token configured for server-side events');
        return;
      }

      const { data, error } = await supabase.functions.invoke('facebook-conversions', {
        body: {
          pixelId: campaign.pixel_id,
          accessToken: campaign.facebook_access_token,
          eventName,
          userData: enrichedData.user_data,
          customData: enrichedData.custom_data,
          testEventCode: campaign.test_event_code
        }
      });

      if (error) {
        console.error('❌ Server-side event error:', error);
      } else {
        console.log('✅ Server-side event sent successfully:', {
          eventName,
          eventsReceived: data.events_received
        });
      }

    } catch (error) {
      console.error('❌ Server-side event failed:', error);
    }
  };

  return {
    trackingData,
    trackEnhancedPageView,
    trackEnhancedLead,
    trackEnhancedCustomEvent,
    logTrackingSummary,
    isReady
  };
};

// Utility functions
const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const normalizePhone = (phone: string): string => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('85') && normalized.length === 11) {
    normalized = '55' + normalized;
  } else if (!normalized.startsWith('55') && normalized.length === 11) {
    normalized = '55' + normalized;
  }
  return normalized;
};
