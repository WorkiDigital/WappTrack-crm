
import { supabase } from "../integrations/supabase/client";
import { Lead, Sale } from "../types";

export const getDashboardStats = async () => {
  try {
    // Get leads count
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*');

    if (leadsError) throw leadsError;

    // Get sales with amount instead of value
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('amount');

    if (salesError) throw salesError;

    const totalLeads = leads?.length || 0;
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;

    return {
      totalLeads,
      totalSales,
      totalRevenue,
      conversionRate: totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0,
      todaysLeads: 0,
      confirmedSales: totalSales,
      pendingConversations: 0,
      monthlyLeads: totalLeads,
      monthlyRevenue: totalRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      totalRevenue: 0,
      conversionRate: 0,
      todaysLeads: 0,
      confirmedSales: 0,
      pendingConversations: 0,
      monthlyLeads: 0,
      monthlyRevenue: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (startDate: string, endDate: string) => {
  try {
    // Get leads for period
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (leadsError) throw leadsError;

    // Get sales for period with amount instead of value
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('amount')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate);

    if (salesError) throw salesError;

    const totalLeads = leads?.length || 0;
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.amount || 0), 0) || 0;

    return {
      totalLeads,
      totalSales,
      totalRevenue,
      conversionRate: totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0,
      todaysLeads: 0,
      confirmedSales: totalSales,
      pendingConversations: 0,
      monthlyLeads: totalLeads,
      monthlyRevenue: totalRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats by period:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      totalRevenue: 0,
      conversionRate: 0,
      todaysLeads: 0,
      confirmedSales: 0,
      pendingConversations: 0,
      monthlyLeads: 0,
      monthlyRevenue: 0
    };
  }
};

export const getCampaignPerformance = async () => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('campaign, campaign_id');

    if (error) throw error;

    const campaignCounts = leads?.reduce((acc, lead) => {
      const campaign = lead.campaign || 'Unknown';
      const campaignId = lead.campaign_id || 'unknown';
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaignId,
          campaignName: campaign,
          leads: 0,
          sales: 0,
          revenue: 0,
          conversionRate: 0
        };
      }
      acc[campaignId].leads++;
      return acc;
    }, {} as Record<string, any>) || {};

    return Object.values(campaignCounts);
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};

export const getMonthlyStats = async () => {
  try {
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('created_at');

    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('sale_date, amount');

    if (salesError) throw salesError;

    // Process monthly data
    const monthlyData: { [key: string]: { leads: number; sales: number; revenue: number } } = {};

    leads?.forEach(lead => {
      const month = new Date(lead.created_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { leads: 0, sales: 0, revenue: 0 };
      }
      monthlyData[month].leads++;
    });

    sales?.forEach(sale => {
      const month = new Date(sale.sale_date).toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { leads: 0, sales: 0, revenue: 0 };
      }
      monthlyData[month].sales++;
      monthlyData[month].revenue += sale.amount || 0;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        ...data
      }));
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
};

export const getTimelineData = async (startDate?: string, endDate?: string) => {
  try {
    let leadsQuery = supabase
      .from('leads')
      .select('created_at, name, campaign')
      .order('created_at', { ascending: false })
      .limit(10);

    if (startDate) leadsQuery = leadsQuery.gte('created_at', startDate);
    if (endDate) leadsQuery = leadsQuery.lte('created_at', endDate);

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) throw leadsError;

    let salesQuery = supabase
      .from('sales')
      .select('sale_date, amount')
      .order('sale_date', { ascending: false })
      .limit(10);

    if (startDate) salesQuery = salesQuery.gte('sale_date', startDate);
    if (endDate) salesQuery = salesQuery.lte('sale_date', endDate);

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    // Process data for timeline chart format
    const timelineData: { [key: string]: { date: string; leads: number; sales: number; revenue: number } } = {};

    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      if (!timelineData[date]) {
        timelineData[date] = { date, leads: 0, sales: 0, revenue: 0 };
      }
      timelineData[date].leads++;
    });

    sales?.forEach(sale => {
      const date = new Date(sale.sale_date).toISOString().split('T')[0];
      if (!timelineData[date]) {
        timelineData[date] = { date, leads: 0, sales: 0, revenue: 0 };
      }
      timelineData[date].sales++;
      timelineData[date].revenue += sale.amount || 0;
    });

    return Object.values(timelineData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};
