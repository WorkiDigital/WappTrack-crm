
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  progress: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Redirecionando...</CardTitle>
            <CardDescription>
              Você será redirecionado para o WhatsApp em alguns segundos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              Preparando seu atendimento...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingScreen;
