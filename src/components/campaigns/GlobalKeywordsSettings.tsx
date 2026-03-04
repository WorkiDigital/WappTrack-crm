
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface GlobalKeywordsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GlobalKeywords {
  conversionKeywords: string[];
  cancellationKeywords: string[];
}

const GlobalKeywordsSettings: React.FC<GlobalKeywordsSettingsProps> = ({ open, onOpenChange }) => {
  const [keywords, setKeywords] = useState<GlobalKeywords>({
    conversionKeywords: [],
    cancellationKeywords: []
  });
  const [newConversionKeyword, setNewConversionKeyword] = useState('');
  const [newCancellationKeyword, setNewCancellationKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultConversionKeywords = [
    'obrigado pela compra',
    'obrigada pela compra', 
    'venda confirmada',
    'pedido aprovado',
    'parabéns pela aquisição',
    'compra realizada',
    'vendido',
    'venda fechada',
    'negócio fechado',
    'parabéns pela compra',
    'obrigado por comprar',
    'obrigada por comprar',
    'sua compra foi',
    'compra efetuada',
    'pedido confirmado'
  ];

  const defaultCancellationKeywords = [
    'compra cancelada',
    'pedido cancelado',
    'cancelamento',
    'desistiu da compra',
    'não quer mais',
    'mudou de ideia',
    'cancelar pedido',
    'estorno',
    'devolver',
    'não conseguiu pagar'
  ];

  useEffect(() => {
    if (open) {
      loadGlobalKeywords();
    }
  }, [open]);

  const loadGlobalKeywords = async () => {
    try {
      setLoading(true);
      // Para este exemplo, vamos usar as palavras-chave padrão
      // Em uma implementação real, você poderia armazenar isso em uma tabela de configurações globais
      setKeywords({
        conversionKeywords: defaultConversionKeywords,
        cancellationKeywords: defaultCancellationKeywords
      });
    } catch (error: any) {
      console.error('Error loading global keywords:', error);
      toast.error('Erro ao carregar configurações globais');
    } finally {
      setLoading(false);
    }
  };

  const addConversionKeyword = () => {
    if (newConversionKeyword.trim() && !keywords.conversionKeywords.includes(newConversionKeyword.trim())) {
      setKeywords(prev => ({
        ...prev,
        conversionKeywords: [...prev.conversionKeywords, newConversionKeyword.trim()]
      }));
      setNewConversionKeyword('');
    }
  };

  const addCancellationKeyword = () => {
    if (newCancellationKeyword.trim() && !keywords.cancellationKeywords.includes(newCancellationKeyword.trim())) {
      setKeywords(prev => ({
        ...prev,
        cancellationKeywords: [...prev.cancellationKeywords, newCancellationKeyword.trim()]
      }));
      setNewCancellationKeyword('');
    }
  };

  const removeConversionKeyword = (keyword: string) => {
    setKeywords(prev => ({
      ...prev,
      conversionKeywords: prev.conversionKeywords.filter(k => k !== keyword)
    }));
  };

  const removeCancellationKeyword = (keyword: string) => {
    setKeywords(prev => ({
      ...prev,
      cancellationKeywords: prev.cancellationKeywords.filter(k => k !== keyword)
    }));
  };

  const saveGlobalKeywords = async () => {
    try {
      setLoading(true);
      
      // Atualizar todas as campanhas com as novas palavras-chave globais
      const { error } = await supabase
        .from('campaigns')
        .update({
          conversion_keywords: keywords.conversionKeywords,
          cancellation_keywords: keywords.cancellationKeywords
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Atualizar todas as campanhas

      if (error) throw error;

      toast.success('Configurações globais de tags salvas e aplicadas a todas as campanhas!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving global keywords:', error);
      toast.error('Erro ao salvar configurações globais');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setKeywords({
      conversionKeywords: [...defaultConversionKeywords],
      cancellationKeywords: [...defaultCancellationKeywords]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações Globais de Tags</DialogTitle>
          <DialogDescription>
            Configure as palavras-chave que serão aplicadas a todas as campanhas para detectar conversões e cancelamentos automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Palavras-chave de Conversão */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-green-700">
                Palavras-chave de Conversão
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando essas palavras aparecerem nas mensagens, o lead será marcado como convertido automaticamente.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newConversionKeyword}
                onChange={(e) => setNewConversionKeyword(e.target.value)}
                placeholder="Nova palavra-chave de conversão..."
                onKeyPress={(e) => e.key === 'Enter' && addConversionKeyword()}
              />
              <Button onClick={addConversionKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {keywords.conversionKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                  {keyword}
                  <button
                    onClick={() => removeConversionKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Palavras-chave de Cancelamento */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold text-red-700">
                Palavras-chave de Cancelamento
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando essas palavras aparecerem nas mensagens, o lead será marcado como perdido automaticamente.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newCancellationKeyword}
                onChange={(e) => setNewCancellationKeyword(e.target.value)}
                placeholder="Nova palavra-chave de cancelamento..."
                onKeyPress={(e) => e.key === 'Enter' && addCancellationKeyword()}
              />
              <Button onClick={addCancellationKeyword} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {keywords.cancellationKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                  {keyword}
                  <button
                    onClick={() => removeCancellationKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Button variant="outline" onClick={resetToDefaults}>
              Restaurar Padrões
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={saveGlobalKeywords} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar e Aplicar a Todas as Campanhas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalKeywordsSettings;
