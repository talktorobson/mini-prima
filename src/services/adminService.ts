
import { supabase } from '@/integrations/supabase/client';

export const adminService = {
  // Get all admin users (admin only)
  getAdminUsers: async () => {
    console.log('Fetching all admin users...');
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          id,
          user_id,
          role,
          staff_id,
          permissions,
          is_active,
          created_at,
          updated_at,
          staff:staff_id (
            full_name,
            email,
            position
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin users:', error);
        throw error;
      }

      console.log('Successfully fetched admin users:', data);
      return data;
    } catch (error) {
      console.error('Admin users service error:', error);
      throw error;
    }
  },

  // Update admin user permissions (admin only)
  updateAdminUser: async (id: string, updates: {
    role?: 'admin' | 'staff';
    permissions?: any;
    is_active?: boolean;
  }) => {
    console.log('Updating admin user:', id, updates);
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating admin user:', error);
        throw error;
      }

      console.log('Successfully updated admin user:', data);
      return data;
    } catch (error) {
      console.error('Admin user update error:', error);
      throw error;
    }
  },

  // Delete admin user (admin only)
  deleteAdminUser: async (id: string) => {
    console.log('Deleting admin user:', id);
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting admin user:', error);
        throw error;
      }

      console.log('Successfully deleted admin user');
    } catch (error) {
      console.error('Admin user delete error:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    console.log('Fetching dashboard statistics...');
    
    try {
      // Get client count
      const { count: clientCount } = await supabase
        .from('clients')
        .select('id', { count: 'exact' });

      // Get active cases count
      const { count: activeCasesCount } = await supabase
        .from('cases')
        .select('id', { count: 'exact' })
        .in('status', ['Open', 'In Progress']);

      // Get documents count
      const { count: documentsCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact' });

      // Get pending amount
      const { data: pendingAmountData } = await supabase
        .from('financial_records')
        .select('amount')
        .eq('status', 'Pending')
        .eq('type', 'Receivable');

      const pendingAmount = pendingAmountData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      const stats = {
        clientCount: clientCount || 0,
        activeCasesCount: activeCasesCount || 0,
        documentsCount: documentsCount || 0,
        pendingAmount
      };

      console.log('Dashboard stats:', stats);
      return stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }
};
