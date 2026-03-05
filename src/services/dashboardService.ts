
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "../integrations/supabase/client";

// ── helpers ──────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

// ── main stats ────────────────────────────────────────────────────────────────

export const getDashboardStatsByPeriod = async (startDate: string, endDate: string) => {
  try {
    const { start: mStart, end: mEnd } = currentMonthRange();

    // Leads no período selecionado (com info de etapa do pipeline)
    const { data: periodLeads, error: e1 } = await (supabase as any)
      .from('leads')
      .select('id, pipeline_stage_id, unread_count, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    if (e1) throw e1;

    // Leads do mês atual
    const { data: monthLeads, error: e2 } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', mStart)
      .lte('created_at', mEnd);
    if (e2) throw e2;

    // Etapas vencedoras (is_won) para calcular conversão via pipeline
    const { data: wonStages, error: e3 } = await supabase
      .from('pipeline_stages' as any)
      .select('id')
      .eq('is_won', true);
    if (e3) throw e3;

    const wonIds = new Set((wonStages || []).map((s: any) => s.id));

    // Conversas pendentes (mensagens não lidas)
    const { count: pendingCount, error: e4 } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gt('unread_count', 0);
    if (e4) throw e4;

    // Receita do mês via tabela sales (se existir)
    const { data: monthlySales } = await (supabase as any)
      .from('sales')
      .select('amount')
      .gte('sale_date', mStart)
      .lte('sale_date', mEnd);
    // ignora erro se tabela sales não existir

    const totalLeads   = periodLeads?.length || 0;
    const confirmedSales = (periodLeads || []).filter(l => l.pipeline_stage_id && wonIds.has(l.pipeline_stage_id)).length;
    const monthlyLeads = monthLeads?.length || 0;
    const monthlyRevenue = (monthlySales || []).reduce((s, r) => s + (r.amount || 0), 0);

    return {
      totalLeads,
      totalSales: confirmedSales,
      totalRevenue: monthlyRevenue,
      conversionRate: totalLeads > 0 ? (confirmedSales / totalLeads) * 100 : 0,
      todaysLeads: 0,
      confirmedSales,
      pendingConversations: pendingCount || 0,
      monthlyLeads,
      monthlyRevenue,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalLeads: 0, totalSales: 0, totalRevenue: 0, conversionRate: 0,
      todaysLeads: 0, confirmedSales: 0, pendingConversations: 0,
      monthlyLeads: 0, monthlyRevenue: 0,
    };
  }
};

// ── campaign performance ──────────────────────────────────────────────────────

export const getCampaignPerformance = async () => {
  try {
    // Busca leads com etapa do pipeline para calcular conversão real
    const { data: leads, error } = await (supabase as any)
      .from('leads')
      .select('campaign, campaign_id, pipeline_stage_id');
    if (error) throw error;

    // Etapas vencedoras
    const { data: wonStages } = await supabase
      .from('pipeline_stages' as any)
      .select('id')
      .eq('is_won', true);
    const wonIds = new Set((wonStages || []).map((s: any) => s.id));

    const map: Record<string, { campaignId: string; campaignName: string; leads: number; sales: number; revenue: number; conversionRate: number }> = {};

    for (const lead of leads || []) {
      const key = lead.campaign_id || lead.campaign || 'unknown';
      if (!map[key]) {
        map[key] = {
          campaignId: key,
          campaignName: lead.campaign || 'Sem campanha',
          leads: 0, sales: 0, revenue: 0, conversionRate: 0,
        };
      }
      map[key].leads++;
      if (lead.pipeline_stage_id && wonIds.has(lead.pipeline_stage_id)) {
        map[key].sales++;
      }
    }

    return Object.values(map).map(c => ({
      ...c,
      conversionRate: c.leads > 0 ? (c.sales / c.leads) * 100 : 0,
    }));
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    return [];
  }
};

// ── timeline ──────────────────────────────────────────────────────────────────

export const getTimelineData = async (startDate?: string, endDate?: string) => {
  try {
    let leadsQ = supabase
      .from('leads')
      .select('created_at')
      .order('created_at', { ascending: true });
    if (startDate) leadsQ = leadsQ.gte('created_at', startDate);
    if (endDate)   leadsQ = leadsQ.lte('created_at', endDate);

    const { data: leads, error: e1 } = await leadsQ;
    if (e1) throw e1;

    let salesQ = (supabase as any)
      .from('sales')
      .select('sale_date, amount')
      .order('sale_date', { ascending: true });
    if (startDate) salesQ = salesQ.gte('sale_date', startDate);
    if (endDate)   salesQ = salesQ.lte('sale_date', endDate);
    const { data: sales } = await salesQ; // ignora erro se tabela não existir

    const timeline: Record<string, { date: string; leads: number; sales: number; revenue: number }> = {};

    (leads || []).forEach(l => {
      const date = l.created_at.split('T')[0];
      if (!timeline[date]) timeline[date] = { date, leads: 0, sales: 0, revenue: 0 };
      timeline[date].leads++;
    });

    (sales || []).forEach((s: any) => {
      const date = s.sale_date?.split('T')[0];
      if (!date) return;
      if (!timeline[date]) timeline[date] = { date, leads: 0, sales: 0, revenue: 0 };
      timeline[date].sales++;
      timeline[date].revenue += s.amount || 0;
    });

    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return [];
  }
};

// ── legacy (mantido para compatibilidade) ─────────────────────────────────────

export const getDashboardStats = getDashboardStatsByPeriod.bind(null,
  new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
  new Date().toISOString()
);

export const getMonthlyStats = async () => {
  try {
    const { data: leads } = await supabase.from('leads').select('created_at');
    const { data: sales } = await (supabase as any).from('sales').select('sale_date, amount');
    const monthly: Record<string, { leads: number; sales: number; revenue: number }> = {};
    (leads || []).forEach(l => {
      const m = l.created_at.slice(0, 7);
      if (!monthly[m]) monthly[m] = { leads: 0, sales: 0, revenue: 0 };
      monthly[m].leads++;
    });
    (sales || []).forEach((s: any) => {
      const m = s.sale_date?.slice(0, 7);
      if (!m) return;
      if (!monthly[m]) monthly[m] = { leads: 0, sales: 0, revenue: 0 };
      monthly[m].sales++;
      monthly[m].revenue += s.amount || 0;
    });
    return Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({ month, ...data }));
  } catch {
    return [];
  }
};
