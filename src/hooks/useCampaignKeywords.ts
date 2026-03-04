
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CampaignKeywords {
  conversionKeywords: string[];
  cancellationKeywords: string[];
}

export const useCampaignKeywords = (campaignId: string) => {
  const [keywords, setKeywords] = useState<CampaignKeywords>({
    conversionKeywords: [],
    cancellationKeywords: []
  });
  const [loading, setLoading] = useState(false);

  const loadKeywords = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('conversion_keywords, cancellation_keywords')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      setKeywords({
        conversionKeywords: data.conversion_keywords || [],
        cancellationKeywords: data.cancellation_keywords || []
      });
    } catch (error: any) {
      console.error('Error loading campaign keywords:', error);
      toast.error('Erro ao carregar palavras-chave da campanha');
    } finally {
      setLoading(false);
    }
  };

  const saveKeywords = async (newKeywords: CampaignKeywords) => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('campaigns')
        .update({
          conversion_keywords: newKeywords.conversionKeywords,
          cancellation_keywords: newKeywords.cancellationKeywords
        })
        .eq('id', campaignId);

      if (error) throw error;

      setKeywords(newKeywords);
      toast.success('Palavras-chave salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving campaign keywords:', error);
      toast.error('Erro ao salvar palavras-chave da campanha');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeywords();
  }, [campaignId]);

  return {
    keywords,
    loading,
    saveKeywords,
    setConversionKeywords: (keywords: string[]) => 
      setKeywords(prev => ({ ...prev, conversionKeywords: keywords })),
    setCancellationKeywords: (keywords: string[]) => 
      setKeywords(prev => ({ ...prev, cancellationKeywords: keywords }))
  };
};
