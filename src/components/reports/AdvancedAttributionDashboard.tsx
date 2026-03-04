
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getAttributionReport, getLeadSourceReport, getCampaignPerformanceDetails, AttributionData, LeadSourceReport, CampaignPerformanceDetail } from '@/services/attributionService';
import { Instagram, Facebook, TrendingUp, TrendingDown, Target, Users, DollarSign, Percent } from 'lucide-react';

const COLORS = ['#3b82f6', '#e11d48', '#10b981', '#f59e0b', '#8b5cf6'];

export const AdvancedAttributionDashboard = () => {
  const [attributionData, setAttributionData] = useState<AttributionData[]>([]);
  const [sourceReport, setSourceReport] = useState<LeadSourceReport[]>([]);
  const [campaignDetails, setCampaignDetails] = useState<CampaignPerformanceDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [attribution, sources, campaigns] = await Promise.all([
          getAttributionReport(),
          getLeadSourceReport(),
          getCampaignPerformanceDetails()
        ]);
        
        setAttributionData(attribution);
        setSourceReport(sources);
        setCampaignDetails(campaigns);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'facebook':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  // Calculate totals for summary cards
  const totalLeads = attributionData.reduce((sum, item) => sum + item.leads_count, 0);
  const totalConversions = attributionData.reduce((sum, item) => sum + (item.leads_count * item.conversion_rate / 100), 0);
  const overallConversionRate = totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0;
  const avgLeadScore = attributionData.length > 0 
    ? attributionData.reduce((sum, item) => sum + item.avg_lead_score, 0) / attributionData.length 
    : 0;

  // Prepare chart data
  const sourceComparisonData = attributionData.map(item => ({
    name: `${item.source} (${item.medium})`,
    leads: item.leads_count,
    conversions: Math.round(item.leads_count * item.conversion_rate / 100),
    score: Math.round(item.avg_lead_score),
    source: item.source
  }));

  const pieChartData = attributionData.map((item, index) => ({
    name: item.source,
    value: item.leads_count,
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-200 rounded-t-lg"></CardHeader>
            <CardContent className="h-32 bg-gray-100"></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Todos os canais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalConversions.toFixed(0)} conversões
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadScore.toFixed(0)}</div>
            <Progress value={avgLeadScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {attributionData.reduce((sum, item) => sum + item.total_value, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor estimado dos leads
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attribution">Atribuição</TabsTrigger>
          <TabsTrigger value="sources">Fontes</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="attribution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads por Fonte</CardTitle>
                <CardDescription>Distribuição de leads por canal de aquisição</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Canal</CardTitle>
                <CardDescription>Comparação de leads e conversões</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sourceComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                    <Bar dataKey="conversions" fill="#10b981" name="Conversões" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Attribution Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Canal</CardTitle>
              <CardDescription>Métricas detalhadas de cada fonte de tráfego</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attributionData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full text-white ${getSourceColor(item.source)}`}>
                        {getSourceIcon(item.source)}
                      </div>
                      <div>
                        <div className="font-medium">{item.source}</div>
                        <div className="text-sm text-muted-foreground">{item.medium} - {item.campaign}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold">{item.leads_count}</div>
                        <div className="text-xs text-muted-foreground">Leads</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold">{item.conversion_rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Conversão</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold">{item.avg_lead_score.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      
                      <Badge variant={item.conversion_rate > overallConversionRate ? "default" : "secondary"}>
                        {item.conversion_rate > overallConversionRate ? "Alto" : "Normal"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instagram vs Facebook</CardTitle>
              <CardDescription>Comparação temporal de performance entre as principais fontes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={sourceReport}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="instagram_leads" stroke="#e11d48" strokeWidth={2} name="Instagram Leads" />
                  <Line type="monotone" dataKey="facebook_leads" stroke="#3b82f6" strokeWidth={2} name="Facebook Leads" />
                  <Line type="monotone" dataKey="instagram_conversions" stroke="#be185d" strokeWidth={2} strokeDasharray="5 5" name="Instagram Conversões" />
                  <Line type="monotone" dataKey="facebook_conversions" stroke="#1e40af" strokeWidth={2} strokeDasharray="5 5" name="Facebook Conversões" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Campanhas</CardTitle>
              <CardDescription>Métricas detalhadas por campanha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignDetails.map((campaign, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{campaign.campaign_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {campaign.utm_source} • {campaign.utm_medium}
                        </p>
                      </div>
                      <Badge variant={campaign.conversion_rate > 20 ? "default" : "secondary"}>
                        {campaign.conversion_rate.toFixed(1)}% conversão
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{campaign.total_leads}</div>
                        <div className="text-xs text-muted-foreground">Total Leads</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{campaign.qualified_leads}</div>
                        <div className="text-xs text-muted-foreground">Qualificados</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{campaign.converted_leads}</div>
                        <div className="text-xs text-muted-foreground">Convertidos</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{campaign.avg_lead_score.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">Score Médio</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{campaign.qualification_rate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Qualificação</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Taxa de Conversão</span>
                        <span>{campaign.conversion_rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={campaign.conversion_rate} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Score dos Leads por Fonte</CardTitle>
              <CardDescription>Qualidade média dos leads por canal de aquisição</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8b5cf6" name="Score Médio" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
