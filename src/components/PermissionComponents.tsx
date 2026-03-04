import React from 'react';
import { useSharedAccess } from '@/context/SharedAccessContext';

interface PermissionGateProps {
  module: string;
  permission: 'view' | 'edit';
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ module, permission, children }) => {
  const { isSharedMode, permissions } = useSharedAccess();

  // If not in shared mode, allow everything
  if (!isSharedMode) {
    return <>{children}</>;
  }

  // If in shared mode, check permissions
  const hasPermission = permissions?.[module]?.[permission] === true;

  if (!hasPermission) {
    return null; // Don't render anything if permission is not granted
  }

  return <>{children}</>;
};

interface PermissionButtonProps {
  module: string;
  permission: 'view' | 'edit';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({ 
  module, 
  permission, 
  children, 
  className = '', 
  onClick,
  disabled = false 
}) => {
  const { isSharedMode, permissions } = useSharedAccess();

  // If not in shared mode, allow everything
  if (!isSharedMode) {
    return (
      <button 
        className={className} 
        onClick={onClick} 
        disabled={disabled}
      >
        {children}
      </button>
    );
  }

  // If in shared mode, check permissions
  const hasPermission = permissions?.[module]?.[permission] === true;

  return (
    <button 
      className={className} 
      onClick={onClick} 
      disabled={disabled || !hasPermission}
      style={{ 
        opacity: hasPermission ? 1 : 0.5,
        cursor: hasPermission ? 'pointer' : 'not-allowed'
      }}
    >
      {children}
    </button>
  );
};

interface PermissionInputProps {
  module: string;
  permission: 'view' | 'edit';
  children: React.ReactNode;
  className?: string;
}

export const PermissionInput: React.FC<PermissionInputProps> = ({ 
  module, 
  permission, 
  children, 
  className = '' 
}) => {
  const { isSharedMode, permissions } = useSharedAccess();

  // If not in shared mode, allow everything
  if (!isSharedMode) {
    return <div className={className}>{children}</div>;
  }

  // If in shared mode, check permissions
  const hasPermission = permissions?.[module]?.[permission] === true;

  return (
    <div 
      className={className}
      style={{ 
        opacity: hasPermission ? 1 : 0.5,
        pointerEvents: hasPermission ? 'auto' : 'none'
      }}
    >
      {children}
    </div>
  );
};

