
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface UrlParametersDisplayProps {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const UrlParametersDisplay: React.FC<UrlParametersDisplayProps> = ({
  utm_source,
  utm_medium,
  utm_campaign,
  utm_content,
  utm_term
}) => {
  // 🎯 EXTRAIR GCLID E FBCLID DOS PARÂMETROS
  const extractParam = (content: string | undefined, param: string) => {
    if (!content) return null;
    const match = content.match(new RegExp(`${param}=([^&]+)`));
    return match ? match[1] : null;
  };

  const gclid = extractParam(utm_content, 'gclid') || extractParam(utm_term, 'gclid');
  const fbclid = extractParam(utm_content, 'fbclid') || extractParam(utm_term, 'fbclid');

  // Montar parâmetros para exibição
  const parameters = [
    utm_source && { label: 'utm_source', value: utm_source },
    utm_medium && { label: 'utm_medium', value: utm_medium },
    utm_campaign && { label: 'utm_campaign', value: utm_campaign },
    gclid && { label: 'gclid', value: gclid },
    fbclid && { label: 'fbclid', value: fbclid },
    utm_content && !gclid && !fbclid && { label: 'utm_content', value: utm_content },
    utm_term && !gclid && !fbclid && { label: 'utm_term', value: utm_term },
  ].filter(Boolean);

  if (parameters.length === 0) {
    return <span className="text-muted-foreground italic">Sem parâmetros</span>;
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {parameters.map((param, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {param.label}: {param.value.length > 15 ? `${param.value.substring(0, 15)}...` : param.value}
        </Badge>
      ))}
    </div>
  );
};

export default UrlParametersDisplay;
