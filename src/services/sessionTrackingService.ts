
import { supabase } from '@/integrations/supabase/client';

interface SessionData {
  id: string;
  lead_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  landing_page?: string;
  session_duration?: number;
  pages_visited?: number;
  created_at: string;
}

interface TrackSessionParams {
  leadId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPage?: string;
  sessionDuration?: number;
  pagesVisited?: number;
}

export interface SaveTrackingDataResult {
  success: boolean;
  session_id?: string;
  browser_fingerprint?: string;
}

export const saveTrackingData = async (
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  },
  campaignId: string
): Promise<SaveTrackingDataResult> => {
  try {
    // Create a utm_clicks entry for tracking
    const { data, error } = await supabase
      .from('utm_clicks')
      .insert({
        phone: 'anonymous',
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_content: utmParams.utm_content,
        utm_term: utmParams.utm_term
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving tracking data:', error);
      return { success: false };
    }

    return {
      success: true,
      session_id: data.id,
      browser_fingerprint: `${utmParams.utm_source || 'unknown'}_${Date.now()}`
    };
  } catch (error) {
    console.error('Error saving tracking data:', error);
    return { success: false };
  }
};

export const trackSession = async (params: TrackSessionParams): Promise<boolean> => {
  try {
    // Instead of creating a separate tracking_sessions table, 
    // we'll store this data in the leads table or utm_clicks table
    
    if (params.leadId) {
      // Update lead with session information
      const { error } = await supabase
        .from('leads')
        .update({
          utm_source: params.utmSource,
          utm_medium: params.utmMedium,
          utm_campaign: params.utmCampaign,
          utm_content: params.utmContent,
          utm_term: params.utmTerm
        })
        .eq('id', params.leadId);

      if (error) {
        console.error('Error updating lead with session data:', error);
        return false;
      }
    } else {
      // Create a utm_clicks entry for anonymous sessions
      const { error } = await supabase
        .from('utm_clicks')
        .insert({
          phone: 'anonymous', // Required field
          utm_source: params.utmSource,
          utm_medium: params.utmMedium,
          utm_campaign: params.utmCampaign,
          utm_content: params.utmContent,
          utm_term: params.utmTerm
        });

      if (error) {
        console.error('Error creating utm_clicks entry:', error);
        return false;
      }
    }

    console.log('Session tracked successfully');
    return true;
  } catch (error) {
    console.error('Error tracking session:', error);
    return false;
  }
};

export const getSessionData = async (leadId: string): Promise<SessionData | null> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, created_at')
      .eq('id', leadId)
      .single();

    if (error || !data) {
      console.error('Error fetching session data:', error);
      return null;
    }

    return {
      id: data.id,
      lead_id: leadId,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error getting session data:', error);
    return null;
  }
};

export const getAllSessions = async (): Promise<SessionData[]> => {
  try {
    const { data, error } = await supabase
      .from('utm_clicks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      utm_source: item.utm_source,
      utm_medium: item.utm_medium,
      utm_campaign: item.utm_campaign,
      utm_content: item.utm_content,
      utm_term: item.utm_term,
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Error getting all sessions:', error);
    return [];
  }
};

export const getSessionStats = async () => {
  try {
    const { data, error } = await supabase
      .from('utm_clicks')
      .select('utm_source, utm_medium, utm_campaign');

    if (error) {
      console.error('Error fetching session stats:', error);
      return { sources: {}, mediums: {}, campaigns: {} };
    }

    const sources: { [key: string]: number } = {};
    const mediums: { [key: string]: number } = {};
    const campaigns: { [key: string]: number } = {};

    (data || []).forEach(item => {
      if (item.utm_source) {
        sources[item.utm_source] = (sources[item.utm_source] || 0) + 1;
      }
      if (item.utm_medium) {
        mediums[item.utm_medium] = (mediums[item.utm_medium] || 0) + 1;
      }
      if (item.utm_campaign) {
        campaigns[item.utm_campaign] = (campaigns[item.utm_campaign] || 0) + 1;
      }
    });

    return { sources, mediums, campaigns };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return { sources: {}, mediums: {}, campaigns: {} };
  }
};
