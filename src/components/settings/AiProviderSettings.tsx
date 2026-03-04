import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT-4o)', placeholder: 'sk-...' },
  { value: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
];

const AiProviderSettings = () => {
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [savedHint, setSavedHint] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('company_settings')
        .select('ai_provider, ai_api_key')
        .eq('user_id', user.id)
        .single();

      if (data) {
        if (data.ai_provider) setProvider(data.ai_provider);
        if (data.ai_api_key) setSavedHint(data.ai_api_key);
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Insira a chave da API');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-ai-settings', {
        body: { ai_provider: provider, ai_api_key: apiKey.trim() },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao salvar');

      setSavedHint(apiKey.trim().substring(0, 8) + '...');
      setApiKey('');
      toast.success(`Provedor ${AI_PROVIDERS.find(p => p.value === provider)?.label} configurado com sucesso!`);
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações de IA');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.value === provider);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Provedor de IA
        </CardTitle>
        <CardDescription>
          Configure o provedor e a chave de API usada pelos agentes de atendimento automatizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedHint && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Chave configurada: <span className="font-mono font-medium">{savedHint}</span>
            </span>
          </div>
        )}

        <div className="grid gap-2">
          <Label>Provedor de IA</Label>
          <Select value={provider} onValueChange={setProvider} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o provedor..." />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDERS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api-key">
            Chave da API {savedHint ? '(deixe em branco para manter a atual)' : ''}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider?.placeholder || 'Cole sua chave aqui...'}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoading || !apiKey.trim()}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A chave é armazenada de forma segura e usada pelos agentes de IA nas conversas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiProviderSettings;
