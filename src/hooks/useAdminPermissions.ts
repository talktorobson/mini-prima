
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export type AccessType = 
  | 'client_access'
  | 'billing'
  | 'messaging'
  | 'cases_management'
  | 'document_management'
  | 'system_setup';

interface Permission {
  id: string;
  staff_id: string;
  access_type: AccessType;
  is_active: boolean;
  granted_at: string;
}

export const useAdminPermissions = () => {
  const [permissions, setPermissions] = useState<AccessType[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, adminUser } = useAdminAuth();

  useEffect(() => {
    if (user && adminUser) {
      fetchPermissions();
    }
  }, [user, adminUser]);

  const fetchPermissions = async () => {
    if (!adminUser) return;

    try {
      setLoading(true);

      // Admins have all permissions
      if (adminUser.role === 'admin') {
        setPermissions([
          'client_access',
          'billing',
          'messaging',
          'cases_management',
          'document_management',
          'system_setup'
        ]);
        return;
      }

      // For staff, fetch their specific permissions
      const { data, error } = await supabase
        .from('staff_access_permissions')
        .select('access_type')
        .eq('staff_id', adminUser.staff_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
        return;
      }

      setPermissions(data.map(p => p.access_type as AccessType));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (accessType: AccessType): boolean => {
    return permissions.includes(accessType);
  };

  const hasAnyPermission = (accessTypes: AccessType[]): boolean => {
    return accessTypes.some(type => permissions.includes(type));
  };

  const canAccess = {
    clients: hasPermission('client_access'),
    billing: hasPermission('billing'),
    messaging: hasPermission('messaging'),
    cases: hasPermission('cases_management'),
    documents: hasPermission('document_management'),
    settings: hasPermission('system_setup'),
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    canAccess,
    isAdmin: adminUser?.role === 'admin'
  };
};
