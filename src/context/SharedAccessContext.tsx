import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedTokenPermissions } from '../services/sharedAccessService';

interface SharedAccessContextType {
  token: string | null;
  permissions: any | null;
  isLoading: boolean;
  isSharedMode: boolean;
}

const SharedAccessContext = createContext<SharedAccessContextType>({} as SharedAccessContextType);

export const useSharedAccess = () => useContext(SharedAccessContext);

export const SharedAccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token: routeToken } = useParams<{ token: string }>();
  const [token, setToken] = useState<string | null>(routeToken || null);
  const [permissions, setPermissions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSharedMode = !!routeToken;

  useEffect(() => {
    const validateToken = async () => {
      if (routeToken) {
        try {
          setIsLoading(true);
          const data = await getSharedTokenPermissions(routeToken);
          if (data) {
            setPermissions(data.permissions);
            setToken(routeToken);
          } else {
            // Token invalid or expired
            setPermissions(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Error validating shared token:', error);
          setPermissions(null);
          setToken(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [routeToken]);

  return (
    <SharedAccessContext.Provider value={{
      token,
      permissions,
      isLoading,
      isSharedMode,
    }}>
      {children}
    </SharedAccessContext.Provider>
  );
};


