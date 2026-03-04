
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CampaignKeywordsSettingsProps {
  conversionKeywords: string[];
  cancellationKeywords: string[];
  onConversionKeywordsChange: (keywords: string[]) => void;
  onCancellationKeywordsChange: (keywords: string[]) => void;
}

const CampaignKeywordsSettings = ({
  conversionKeywords,
  cancellationKeywords,
  onConversionKeywordsChange,
  onCancellationKeywordsChange
}: CampaignKeywordsSettingsProps) => {
  const addKeyword = (type: 'conversion' | 'cancellation', keyword: string) => {
    if (!keyword.trim()) return;
    
    if (type === 'conversion') {
      onConversionKeywordsChange([...conversionKeywords, keyword.trim()]);
    } else {
      onCancellationKeywordsChange([...cancellationKeywords, keyword.trim()]);
    }
  };

  const removeKeyword = (type: 'conversion' | 'cancellation', index: number) => {
    if (type === 'conversion') {
      const newKeywords = conversionKeywords.filter((_, i) => i !== index);
      onConversionKeywordsChange(newKeywords);
    } else {
      const newKeywords = cancellationKeywords.filter((_, i) => i !== index);
      onCancellationKeywordsChange(newKeywords);
    }
  };

  const KeywordInput = ({ 
    type, 
    placeholder 
  }: { 
    type: 'conversion' | 'cancellation';
    placeholder: string;
  }) => {
    const [newKeyword, setNewKeyword] = React.useState('');

    const handleAdd = () => {
      addKeyword(type, newKeyword);
      setNewKeyword('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    };

    return (
      <div className="flex gap-2">
        <Input
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          type="button" 
          onClick={handleAdd}
          size="sm"
          disabled={!newKeyword.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const KeywordList = ({ 
    keywords, 
    type 
  }: { 
    keywords: string[];
    type: 'conversion' | 'cancellation';
  }) => (
    <div className="space-y-2">
      {keywords.map((keyword, index) => (
        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
          <span className="text-sm">{keyword}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeKeyword(type, index)}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Palavras-chave Automáticas</CardTitle>
        <CardDescription>
          Configure palavras-chave para detecção automática de conversões e cancelamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium text-green-700 dark:text-green-400">
              Palavras-chave de Conversão
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Quando o comercial enviar uma mensagem contendo essas palavras, o lead será automaticamente marcado como 'convertido'
            </p>
            <KeywordInput 
              type="conversion" 
              placeholder="Ex: obrigado pela compra"
            />
            <div className="mt-3">
              <KeywordList keywords={conversionKeywords} type="conversion" />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium text-red-700 dark:text-red-400">
              Palavras-chave de Cancelamento
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Quando o comercial enviar uma mensagem contendo essas palavras, o lead será automaticamente marcado como 'lost'
            </p>
            <KeywordInput 
              type="cancellation" 
              placeholder="Ex: compra cancelada"
            />
            <div className="mt-3">
              <KeywordList keywords={cancellationKeywords} type="cancellation" />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>O sistema monitora mensagens enviadas pelo comercial (não do cliente)</li>
            <li>Quando uma mensagem contém palavras de conversão → lead vira 'convertido'</li>
            <li>Quando uma mensagem contém palavras de cancelamento → lead vira 'lost'</li>
            <li>A detecção não diferencia maiúsculas/minúsculas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignKeywordsSettings;
