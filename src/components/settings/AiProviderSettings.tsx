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
  {
    value: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-...',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o (mais capaz)' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini (mais rápido)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (econômico)' },
    ],
  },
  {
    value: 'anthropic',
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    models: [
      { value: 'claude-opus-4-6', label: 'Claude Opus 4.6 (mais capaz)' },
      { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (balanceado)' },
      { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (mais rápido)' },
    ],
  },
  {
    value: 'gemini',
    label: 'Google Gemini',
    placeholder: 'AIza...',
    models: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (mais rápido)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (mais capaz)' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (econômico)' },
    ],
  },
];

const AiProviderSettings = () => {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [savedHint, setSavedHint] = useState('');
  const [savedModel, setSavedModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const selectedProvider = AI_PROVIDERS.find(p => p.value === provider)!;

  // Reset model when provider changes
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const p = AI_PROVIDERS.find(p => p.value === newProvider);
    if (p) setModel(p.models[0].value);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data } = await supabase
        .from('company_settings')
        .select('ai_provider, ai_api_key, ai_model')
        .eq('user_id', user.id)
        .single();

      if (data) {
        if (data.ai_provider) setProvider(data.ai_provider);
        if (data.ai_api_key) setSavedHint(data.ai_api_key);
        if (data.ai_model) {
          setModel(data.ai_model);
          setSavedModel(data.ai_model);
        }
      }
      setIsLoading(false);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!apiKey.trim() && !savedHint) {
      toast.error('Insira a chave da API');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-ai-settings', {
        body: {
          ai_provider: provider,
          ai_api_key: apiKey.trim() || undefined,
          ai_model: model,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao salvar');

      if (apiKey.trim()) {
        setSavedHint(apiKey.trim().substring(0, 8) + '...');
        setApiKey('');
      }
      setSavedModel(model);
      toast.success(`Configurações salvas: ${selectedProvider.label} / ${selectedProvider.models.find(m => m.value === model)?.label}`);
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações de IA');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Provedor de IA
        </CardTitle>
        <CardDescription>
          Configure o provedor, modelo e chave de API usada pelos agentes de atendimento automatizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedHint && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              Chave ativa: <span className="font-mono font-medium">{savedHint}</span>
              {savedModel && (
                <span className="ml-2 text-muted-foreground">
                  · Modelo: <span className="font-medium">{savedModel}</span>
                </span>
              )}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Provedor</Label>
            <Select value={provider} onValueChange={handleProviderChange} disabled={isLoading}>
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
            <Label>Modelo</Label>
            <Select value={model} onValueChange={setModel} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo..." />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider.models.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api-key">
            Chave da API{savedHint ? ' (deixe em branco para manter a atual)' : ''}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedProvider.placeholder}
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
            <Button onClick={handleSave} disabled={isSaving || isLoading || (!apiKey.trim() && !savedHint)}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A chave é armazenada de forma segura nos secrets do servidor.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiProviderSettings;
