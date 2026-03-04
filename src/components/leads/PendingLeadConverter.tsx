
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { usePendingLeadConverter } from '@/hooks/usePendingLeadConverter';

const PendingLeadConverter = () => {
  const { convertPendingLeads, isConverting } = usePendingLeadConverter();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Conversão Segura de Leads Pendentes
        </CardTitle>
        <CardDescription>
          Converta leads de formulários que estão pendentes em leads definitivos usando função Supabase com privilégios elevados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button 
            onClick={convertPendingLeads}
            disabled={isConverting}
            variant="outline"
          >
            {isConverting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Converter Pending Leads
              </>
            )}
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>✅ Agora usando função Supabase com SECURITY DEFINER</p>
            <p>🔒 Contorna problemas de RLS e garante conversão segura</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingLeadConverter;
