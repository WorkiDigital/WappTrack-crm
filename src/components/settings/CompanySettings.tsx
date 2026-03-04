
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';

interface CompanySettingsProps {
  formData: {
    company_name: string;
    company_subtitle: string;
    logo_url: string;
  };
  uploading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const CompanySettings = ({ formData, uploading, onInputChange, onFileUpload }: CompanySettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Empresa</CardTitle>
        <CardDescription>
          Configure o nome, descrição e logo da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Empresa *</Label>
          <Input
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={onInputChange}
            placeholder="Digite o nome da sua empresa"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_subtitle">Descrição/Slogan</Label>
          <Input
            id="company_subtitle"
            name="company_subtitle"
            value={formData.company_subtitle}
            onChange={onInputChange}
            placeholder="Ex: Sistema de Marketing Digital"
          />
        </div>

        <div className="space-y-2">
          <Label>Logo da Empresa</Label>
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={onFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PNG, JPG, JPEG (máx. 5MB)
              </p>
            </div>

            {formData.logo_url && (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg border overflow-hidden">
                  <img
                    src={formData.logo_url}
                    alt="Logo da empresa"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
