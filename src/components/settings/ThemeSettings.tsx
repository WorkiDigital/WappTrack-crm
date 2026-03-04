
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Monitor } from 'lucide-react';
import type { Theme } from '@/types';

interface ThemeSettingsProps {
  theme: Theme;
  onThemeChange: (newTheme: Theme) => void;
}

const ThemeSettings = ({ theme, onThemeChange }: ThemeSettingsProps) => {
  const getThemeIcon = (themeValue: string) => {
    switch (themeValue) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize a aparência da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tema</Label>
          <Select value={theme} onValueChange={onThemeChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center space-x-2">
                  {getThemeIcon(theme)}
                  <span>
                    {theme === 'light' && 'Claro'}
                    {theme === 'dark' && 'Escuro'}
                    {theme === 'system' && 'Sistema'}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4" />
                  <span>Claro</span>
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4" />
                  <span>Escuro</span>
                </div>
              </SelectItem>
              <SelectItem value="system">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Sistema</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            O tema do sistema seguirá as configurações do seu dispositivo
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeSettings;
