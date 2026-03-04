
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface BrandingSectionProps {
  isLoading: boolean;
  logo: string;
  title: string;
  subtitle: string;
  campaignName?: string;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({
  isLoading,
  logo,
  title,
  subtitle,
  campaignName
}) => {
  // Não mostra logo nenhuma se não foi enviada pelo usuário (também não mostra logo fake/padrão)
  const noLogo = !logo || logo.trim() === '' || logo.includes('unsplash.com/photo-1618160702438-9b02ab6515c9');

  return (
    <div className="mb-8 text-center">
      {isLoading ? (
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
          <div className="flex flex-col">
            <Skeleton className="h-8 w-32 mb-1" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
      ) : noLogo ? (
        // Centraliza nome e subtítulo, sem espaço reservado para logo
        <div className="flex flex-col items-center justify-center mb-4" style={{ minHeight: '4rem' }}>
          <span className="font-bold text-2xl text-primary">{title}</span>
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        </div>
      ) : (
        // Mostra logo ENVIADA PELO USUÁRIO
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="Logo da empresa"
              className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-2xl text-primary">{title}</span>
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          </div>
        </div>
      )}

      {!isLoading && campaignName && (
        <p className="mt-2 text-gray-600">Campanha: {campaignName}</p>
      )}
      {isLoading && (
        <Skeleton className="h-5 w-48 mx-auto mt-2" />
      )}
    </div>
  );
};

export default BrandingSection;
