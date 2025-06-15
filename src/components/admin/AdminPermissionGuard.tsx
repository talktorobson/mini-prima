
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { useAdminPermissions, AccessType } from '@/hooks/useAdminPermissions';

interface AdminPermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: AccessType;
  requiredPermissions?: AccessType[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

const AdminPermissionGuard: React.FC<AdminPermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback
}) => {
  const { hasPermission, hasAnyPermission, loading, isAdmin } = useAdminPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Admins have access to everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (
      <Alert className="m-4">
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta área. Permissão necessária: {requiredPermission}
        </AlertDescription>
      </Alert>
    );
  }

  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAll 
      ? requiredPermissions.every(permission => hasPermission(permission))
      : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
      return fallback || (
        <Alert className="m-4">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta área. 
            {requireAll ? 'Todas as' : 'Pelo menos uma das'} seguintes permissões são necessárias: {requiredPermissions.join(', ')}
          </AlertDescription>
        </Alert>
      );
    }
  }

  return <>{children}</>;
};

export default AdminPermissionGuard;
