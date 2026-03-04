import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useSharedAccess } from '../context/SharedAccessContext';
import { Skeleton } from '@/components/ui/skeleton';
import MainLayout from '@/components/MainLayout';

const SharedLayout: React.FC = () => {
  const { token, permissions, isLoading, isSharedMode } = useSharedAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isSharedMode && !token) {
      // If in shared mode but token is invalid/expired, redirect to login or a public error page
      navigate('/login'); // Or a more appropriate public error page
    }
  }, [isLoading, isSharedMode, token, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3 p-8">
        <Skeleton className="h-[125px] w-[250px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!isSharedMode || !token || !permissions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Acesso Negado ou Token Inválido</h1>
        <p className="text-muted-foreground">O link compartilhado é inválido ou expirou.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded">Voltar ao Login</button>
      </div>
    );
  }

  return (
    <MainLayout>
      <Outlet /> {/* Renderiza o conteúdo da rota aninhada aqui */}
    </MainLayout>
  );
};

export default SharedLayout;


