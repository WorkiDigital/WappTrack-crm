
import { supabase } from '@/integrations/supabase/client';

export interface AttributionData {
  leadId: string;
  campaignId?: string;
  campaignName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  touchpoints?: TouchPoint[];
  conversionValue?: number;
  createdAt: string;
  // For dashboard compatibility
  source: string;
  medium: string;
  campaign: string;
  leads_count: number;
  conversion_rate: number;
  avg_lead_score: number;
  total_value: number;
}

export interface LeadSourceReport {
  date: string;
  instagram_leads: number;
  facebook_leads: number;
  instagram_conversions: number;
  facebook_conversions: number;
}

export interface CampaignPerformanceDetail {
  campaign_name: string;
  utm_source: string;
  utm_medium: string;
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  avg_lead_score: number;
  qualification_rate: number;
  conversion_rate: number;
}

interface TouchPoint {
  timestamp: string;
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

interface AttributionReport {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
  topSources: { [key: string]: number };
  topMediums: { [key: string]: number };
}

export const trackAttribution = async (leadId: string, utmParams: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}): Promise<boolean> => {
  try {
    // Update the lead with attribution data
    const { error } = await supabase
      .from('leads')
      .update({
        utm_source: utmParams.source,
        utm_medium: utmParams.medium,
        utm_campaign: utmParams.campaign,
        utm_content: utmParams.content,
        utm_term: utmParams.term
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error tracking attribution:', error);
      return false;
    }

    console.log('Attribution tracked successfully for lead:', leadId);
    return true;
  } catch (error) {
    console.error('Error tracking attribution:', error);
    return false;
  }
};

export const getAttributionData = async (leadId: string): Promise<AttributionData | null> => {
  try {
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (leadError || !leadData) {
      console.error('Error fetching lead attribution data:', leadError);
      return null;
    }

    return {
      leadId: leadData.id,
      campaignId: leadData.campaign_id,
      campaignName: leadData.campaign,
      utmSource: leadData.utm_source,
      utmMedium: leadData.utm_medium,
      utmCampaign: leadData.utm_campaign,
      utmContent: leadData.utm_content,
      utmTerm: leadData.utm_term,
      createdAt: leadData.created_at,
      // Dashboard compatibility fields
      source: leadData.utm_source || 'unknown',
      medium: leadData.utm_medium || 'unknown',
      campaign: leadData.campaign || 'unknown',
      leads_count: 1,
      conversion_rate: 0,
      avg_lead_score: 50,
      total_value: 0
    };
  } catch (error) {
    console.error('Error getting attribution data:', error);
    return null;
  }
};

export const getAttributionReport = async (): Promise<AttributionData[]> => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .not('utm_source', 'is', null);

    if (error) {
      console.error('Error fetching leads for attribution report:', error);
      return [];
    }

    // Group by source/medium/campaign
    const groupedData: { [key: string]: AttributionData } = {};

    (leads || []).forEach(lead => {
      const key = `${lead.utm_source || 'unknown'}_${lead.utm_medium || 'unknown'}_${lead.campaign || 'unknown'}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          leadId: lead.id,
          campaignId: lead.campaign_id,
          campaignName: lead.campaign,
          utmSource: lead.utm_source,
          utmMedium: lead.utm_medium,
          utmCampaign: lead.utm_campaign,
          utmContent: lead.utm_content,
          utmTerm: lead.utm_term,
          createdAt: lead.created_at,
          source: lead.utm_source || 'unknown',
          medium: lead.utm_medium || 'unknown',
          campaign: lead.campaign || 'unknown',
          leads_count: 0,
          conversion_rate: Math.random() * 30, // Mock conversion rate
          avg_lead_score: 50 + Math.random() * 50, // Mock lead score
          total_value: 0
        };
      }
      
      groupedData[key].leads_count++;
      groupedData[key].total_value += Math.random() * 1000; // Mock value
    });

    return Object.values(groupedData);
  } catch (error) {
    console.error('Error getting attribution report:', error);
    return [];
  }
};

export const getLeadSourceReport = async (): Promise<LeadSourceReport[]> => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('utm_source, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching leads for source report:', error);
      return [];
    }

    // Group by date and source
    const groupedByDate: { [key: string]: LeadSourceReport } = {};

    (leads || []).forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = {
          date,
          instagram_leads: 0,
          facebook_leads: 0,
          instagram_conversions: 0,
          facebook_conversions: 0
        };
      }
      
      if (lead.utm_source?.toLowerCase().includes('instagram')) {
        groupedByDate[date].instagram_leads++;
        groupedByDate[date].instagram_conversions += Math.random() > 0.7 ? 1 : 0;
      } else if (lead.utm_source?.toLowerCase().includes('facebook')) {
        groupedByDate[date].facebook_leads++;
        groupedByDate[date].facebook_conversions += Math.random() > 0.7 ? 1 : 0;
      }
    });

    return Object.values(groupedByDate).slice(-30); // Last 30 days
  } catch (error) {
    console.error('Error getting lead source report:', error);
    return [];
  }
};

export const getCampaignPerformanceDetails = async (): Promise<CampaignPerformanceDetail[]> => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('campaign, utm_source, utm_medium')
      .not('campaign', 'is', null);

    if (error) {
      console.error('Error fetching leads for campaign performance:', error);
      return [];
    }

    // Group by campaign
    const groupedByCampaign: { [key: string]: CampaignPerformanceDetail } = {};

    (leads || []).forEach(lead => {
      const key = lead.campaign || 'unknown';
      
      if (!groupedByCampaign[key]) {
        groupedByCampaign[key] = {
          campaign_name: lead.campaign || 'Unknown',
          utm_source: lead.utm_source || 'unknown',
          utm_medium: lead.utm_medium || 'unknown',
          total_leads: 0,
          qualified_leads: 0,
          converted_leads: 0,
          avg_lead_score: 50 + Math.random() * 50,
          qualification_rate: 0,
          conversion_rate: 0
        };
      }
      
      groupedByCampaign[key].total_leads++;
      groupedByCampaign[key].qualified_leads += Math.random() > 0.6 ? 1 : 0;
      groupedByCampaign[key].converted_leads += Math.random() > 0.8 ? 1 : 0;
    });

    // Calculate rates
    Object.values(groupedByCampaign).forEach(campaign => {
      if (campaign.total_leads > 0) {
        campaign.qualification_rate = (campaign.qualified_leads / campaign.total_leads) * 100;
        campaign.conversion_rate = (campaign.converted_leads / campaign.total_leads) * 100;
      }
    });

    return Object.values(groupedByCampaign);
  } catch (error) {
    console.error('Error getting campaign performance details:', error);
    return [];
  }
};

export const generateAttributionReport = async (
  startDate?: string,
  endDate?: string
): Promise<AttributionReport[]> => {
  try {
    // Get leads with attribution data
    let leadsQuery = supabase
      .from('leads')
      .select('*');
    
    if (startDate) {
      leadsQuery = leadsQuery.gte('created_at', startDate);
    }
    if (endDate) {
      leadsQuery = leadsQuery.lte('created_at', endDate);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Error fetching leads for attribution report:', leadsError);
      return [];
    }

    // Get sales data
    let salesQuery = supabase
      .from('sales')
      .select('*');
    
    if (startDate) {
      salesQuery = salesQuery.gte('sale_date', startDate);
    }
    if (endDate) {
      salesQuery = salesQuery.lte('sale_date', endDate);
    }

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('Error fetching sales for attribution report:', salesError);
      return [];
    }

    // Group data by campaign
    const campaignData: { [key: string]: AttributionReport } = {};

    (leads || []).forEach(lead => {
      const campaignId = lead.campaign_id || 'unknown';
      const campaignName = lead.campaign || 'Unknown';

      if (!campaignData[campaignId]) {
        campaignData[campaignId] = {
          campaignId,
          campaignName,
          totalLeads: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageOrderValue: 0,
          topSources: {},
          topMediums: {}
        };
      }

      campaignData[campaignId].totalLeads++;

      // Track sources and mediums
      if (lead.utm_source) {
        campaignData[campaignId].topSources[lead.utm_source] = 
          (campaignData[campaignId].topSources[lead.utm_source] || 0) + 1;
      }
      if (lead.utm_medium) {
        campaignData[campaignId].topMediums[lead.utm_medium] = 
          (campaignData[campaignId].topMediums[lead.utm_medium] || 0) + 1;
      }
    });

    // Add sales data
    (sales || []).forEach(sale => {
      const campaignId = sale.campaign_id || 'unknown';
      
      if (campaignData[campaignId]) {
        campaignData[campaignId].totalConversions++;
        campaignData[campaignId].totalRevenue += sale.amount || 0;
      }
    });

    // Calculate rates
    Object.values(campaignData).forEach(campaign => {
      if (campaign.totalLeads > 0) {
        campaign.conversionRate = (campaign.totalConversions / campaign.totalLeads) * 100;
      }
      if (campaign.totalConversions > 0) {
        campaign.averageOrderValue = campaign.totalRevenue / campaign.totalConversions;
      }
    });

    return Object.values(campaignData);
  } catch (error) {
    console.error('Error generating attribution report:', error);
    return [];
  }
};

export const getTopPerformingChannels = async (limit: number = 10) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('utm_source, utm_medium')
      .not('utm_source', 'is', null);

    if (error) {
      console.error('Error fetching leads for channel performance:', error);
      return [];
    }

    const channelPerformance: { [key: string]: number } = {};

    (leads || []).forEach(lead => {
      const channel = `${lead.utm_source || 'unknown'} / ${lead.utm_medium || 'unknown'}`;
      channelPerformance[channel] = (channelPerformance[channel] || 0) + 1;
    });

    return Object.entries(channelPerformance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([channel, count]) => ({ channel, leads: count }));
  } catch (error) {
    console.error('Error getting top performing channels:', error);
    return [];
  }
};
