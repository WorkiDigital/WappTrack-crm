
import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import {
  collectUrlParameters,
  collectDeviceData,
  collectSessionData,
  collectContextData,
  collectFacebookData,
  collectGeolocationData,
  initializeEventTracking,
  UrlParameters,
  DeviceData,
  SessionData,
  ContextData,
  FacebookData,
  GeolocationData
} from '@/lib/dataCollection';

export interface MaximumTrackingData {
  urlParameters: UrlParameters;
  deviceData: DeviceData;
  sessionData: SessionData;
  contextData: ContextData;
  facebookData: FacebookData;
  geolocationData: GeolocationData | null;
  isReady: boolean;
}

export const useMaximumTracking = (campaign?: Campaign | null) => {
  const [trackingData, setTrackingData] = useState<MaximumTrackingData>({
    urlParameters: {},
    deviceData: {} as DeviceData,
    sessionData: {} as SessionData,
    contextData: {} as ContextData,
    facebookData: {},
    geolocationData: null,
    isReady: false
  });

  useEffect(() => {
    const initializeTracking = async () => {
      console.log('🚀 Inicializando tracking máximo...');
      
      // Initialize event tracking
      initializeEventTracking();
      
      // Collect all data immediately available
      const urlParameters = collectUrlParameters();
      const deviceData = collectDeviceData();
      const sessionData = collectSessionData();
      const contextData = collectContextData();
      const facebookData = collectFacebookData();
      
      console.log('📊 Dados coletados:', {
        urlParameters,
        deviceData: { ...deviceData, userAgent: '[HIDDEN]' },
        sessionData,
        contextData: { ...contextData, title: document.title },
        facebookData
      });
      
      // Store UTM parameters for persistence
      if (Object.keys(urlParameters).length > 0) {
        localStorage.setItem('utm_data', JSON.stringify(urlParameters));
        console.log('💾 UTM parameters stored:', urlParameters);
      }
      
      // Update state with immediately available data
      setTrackingData(prev => ({
        ...prev,
        urlParameters,
        deviceData,
        sessionData,
        contextData,
        facebookData,
        isReady: true
      }));
      
      // Collect geolocation data asynchronously
      try {
        const geolocationData = await collectGeolocationData();
        console.log('🌍 Geolocation data collected:', geolocationData);
        
        setTrackingData(prev => ({
          ...prev,
          geolocationData
        }));
      } catch (error) {
        console.warn('⚠️ Geolocation collection failed:', error);
      }
    };

    initializeTracking();
  }, []);

  // Update session data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedSessionData = collectSessionData();
      setTrackingData(prev => ({
        ...prev,
        sessionData: updatedSessionData
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Method to get enriched event data for Facebook Pixel
  const getEnrichedEventData = (customData?: any) => {
    const { urlParameters, deviceData, sessionData, contextData, facebookData, geolocationData } = trackingData;
    
    return {
      // Standard Facebook parameters
      event_source_url: contextData.currentUrl,
      
      // Advanced Matching Data
      user_data: {
        fbc: facebookData.fbc,
        fbp: facebookData.fbp,
        client_ip_address: geolocationData?.ipAddress,
        client_user_agent: deviceData.userAgent,
        // Additional matching data can be added when available
        ...facebookData.advancedMatchingData
      },
      
      // Custom Data with maximum parameters
      custom_data: {
        currency: 'BRL',
        content_name: campaign?.name,
        content_category: campaign?.utm_medium || 'marketing',
        content_ids: campaign ? [campaign.id] : [],
        source_url: contextData.sourceUrl,
        
        // UTM Parameters
        utm_source: urlParameters.utm_source || campaign?.utm_source,
        utm_medium: urlParameters.utm_medium || campaign?.utm_medium,
        utm_campaign: urlParameters.utm_campaign || campaign?.utm_campaign,
        utm_content: urlParameters.utm_content || campaign?.utm_content,
        utm_term: urlParameters.utm_term || campaign?.utm_term,
        
        // Facebook specific
        fbclid: urlParameters.fbclid,
        fb_click_id: urlParameters.fbclid,
        
        // Device and Context
        device_type: deviceData.deviceType,
        browser_name: deviceData.browserName,
        operating_system: deviceData.operatingSystem,
        screen_resolution: deviceData.screenResolution,
        language: deviceData.language,
        timezone: deviceData.timezone,
        
        // Session Data
        session_id: sessionData.sessionId,
        visitor_id: sessionData.visitorId,
        time_on_page: sessionData.timeOnPage,
        scroll_depth: sessionData.scrollDepth,
        page_views: sessionData.pageViews,
        engagement_score: sessionData.engagementScore,
        click_count: sessionData.clickCount,
        
        // Context Data
        referrer: contextData.referrer,
        page_title: contextData.title,
        page_path: contextData.path,
        load_time: contextData.loadTime,
        
        // Geolocation (if available)
        ...(geolocationData && {
          country: geolocationData.country,
          region: geolocationData.region,
          city: geolocationData.city,
          latitude: geolocationData.latitude,
          longitude: geolocationData.longitude
        }),
        
        // Additional tracking IDs
        ...(urlParameters.gclid && { google_click_id: urlParameters.gclid }),
        ...(urlParameters.ttclid && { tiktok_click_id: urlParameters.ttclid }),
        
        // Campaign specific data
        campaign_id: campaign?.id,
        redirect_type: campaign?.redirect_type,
        pixel_integration_type: campaign?.pixel_integration_type,
        
        // Custom data passed from caller
        ...customData
      }
    };
  };

  // Method to log tracking summary
  const logTrackingSummary = () => {
    const summary = {
      'Total Parameters Collected': Object.keys({
        ...trackingData.urlParameters,
        ...trackingData.deviceData,
        ...trackingData.sessionData,
        ...trackingData.contextData,
        ...trackingData.facebookData,
        ...(trackingData.geolocationData || {})
      }).length,
      'UTM Parameters': Object.keys(trackingData.urlParameters).length,
      'Device Parameters': Object.keys(trackingData.deviceData).length,
      'Session Parameters': Object.keys(trackingData.sessionData).length,
      'Context Parameters': Object.keys(trackingData.contextData).length,
      'Facebook Parameters': Object.keys(trackingData.facebookData).length,
      'Geolocation Available': !!trackingData.geolocationData,
      'Engagement Score': trackingData.sessionData.engagementScore || 0
    };
    
    console.log('📈 TRACKING SUMMARY:', summary);
    return summary;
  };

  return {
    trackingData,
    getEnrichedEventData,
    logTrackingSummary,
    isReady: trackingData.isReady
  };
};
