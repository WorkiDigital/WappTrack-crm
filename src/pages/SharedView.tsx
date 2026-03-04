import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSharedAccess } from '../context/SharedAccessContext';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionGate } from '@/components/PermissionComponents';

const SharedView: React.FC = () => {
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Visualização Compartilhada</h1>
      <p className="text-muted-foreground">Você está visualizando o conteúdo através de um link compartilhado.</p>
      <p className="text-muted-foreground">Token: {token}</p>
      <p className="text-muted-foreground">Permissões: {JSON.stringify(permissions)}</p>

      <div className="mt-8 space-y-4">
        <PermissionGate module="dashboard" permission="view">
          <div className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <p>Conteúdo do Dashboard (Visualizar)</p>
            <PermissionGate module="dashboard" permission="edit">
              <button className="px-3 py-1 bg-blue-500 text-white rounded mt-2">Editar Dashboard</button>
            </PermissionGate>
          </div>
        </PermissionGate>

        <PermissionGate module="leads" permission="view">
          <div className="border p-4 rounded-md">
            <h2 className="text-xl font-semibold">Leads</h2>
            <p>Conteúdo de Leads (Visualizar)</p>
            <PermissionGate module="leads" permission="edit">
              <button className="px-3 py-1 bg-blue-500 text-white rounded mt-2">Editar Leads</button>
            </PermissionGate>
          </div>
        </PermissionGate>

        {/* Adicione mais PermissionGates para outros módulos conforme necessário */}

      </div>
    </div>
  );
};

export default SharedView;


