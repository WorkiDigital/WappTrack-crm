
import { useState, useEffect } from 'react';
import { getCampaigns } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';

export const useCampaignLoader = (campaignId: string | null, debug: boolean) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Use enhanced pixel tracking
  const {
    trackEnhancedPageView,
    logTrackingSummary,
    isReady: trackingReady
  } = useEnhancedPixelTracking(campaign, debug);

  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) {
        setError('ID da campanha não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const campaigns = await getCampaigns();
        const targetCampaign = campaigns.find(c => c.id === campaignId);
        
        if (targetCampaign) {
          console.log('📋 Campaign loaded:', targetCampaign.name, 'Redirect type:', targetCampaign.redirect_type);
          setCampaign(targetCampaign);
        } else {
          toast.warning('Campanha não encontrada. O contato será registrado em uma campanha padrão.');
        }
      } catch (err) {
        console.error('❌ Error loading campaign:', err);
        toast.warning('Erro ao carregar detalhes da campanha, mas você ainda pode continuar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignDetails();
  }, [campaignId]);

  // Enhanced page view tracking when campaign and tracking are ready
  useEffect(() => {
    if (campaign && trackingReady && !isLoading) {
      console.log('🚀 Executing enhanced page view tracking...');
      trackEnhancedPageView();
      
      // Log comprehensive tracking summary
      setTimeout(() => {
        logTrackingSummary();
      }, 1000);
    }
  }, [campaign, trackingReady, isLoading]);

  return {
    campaign,
    isLoading,
    error,
    pixelInitialized: !!campaign?.pixel_id && trackingReady
  };
};
