import { supabase } from '@/integrations/supabase/client';

export interface StaffSearchResult {
  type: 'staff_member' | 'permission' | 'assignment' | 'role';
  id: string;
  title: string;
  description: string;
  status: string;
  permissions?: string[];
  data?: any;
}

export const staffManagementService = {
  // Comprehensive search across staff management data
  searchStaffManagementData: async (query: string, filters?: {
    type?: 'staff_member' | 'permission' | 'assignment' | 'role';
    status?: string;
    limit?: number;
  }) => {
    console.log('Searching staff management data:', { query, filters });
    
    try {
      if (!query.trim()) {
        return [];
      }

      const searchTerm = query.toLowerCase();
      const results: StaffSearchResult[] = [];
      const limit = filters?.limit || 20;

      // Search staff members if not filtering by type or filtering by staff_member
      if (!filters?.type || filters.type === 'staff_member') {
        const { data: staffMembers, error: staffError } = await supabase
          .from('staff')
          .select(`
            id,
            full_name,
            email,
            phone,
            position,
            department,
            hire_date,
            is_active,
            created_at
          `)
          .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`)
          .limit(Math.floor(limit / 4))
          .order('created_at', { ascending: false });

        if (staffError) {
          console.error('Error searching staff members:', staffError);
        } else {
          staffMembers?.forEach(staff => {
            results.push({
              type: 'staff_member',
              id: staff.id,
              title: staff.full_name,
              description: `${staff.position} - ${staff.department || 'N/A'} - ${staff.email}`,
              status: staff.is_active ? 'active' : 'inactive',
              data: staff
            });
          });
        }
      }

      // Search admin users/permissions if not filtering by type or filtering by permission/role
      if (!filters?.type || ['permission', 'role'].includes(filters.type)) {
        const { data: adminUsers, error: adminError } = await supabase
          .from('admin_users')
          .select(`
            id,
            user_id,
            role,
            staff_id,
            permissions,
            is_active,
            created_at,
            staff:staff_id (
              full_name,
              email,
              position
            )
          `)
          .limit(Math.floor(limit / 4))
          .order('created_at', { ascending: false });

        if (adminError) {
          console.error('Error searching admin users:', adminError);
        } else {
          adminUsers?.forEach(admin => {
            // Add as permission/role result
            results.push({
              type: 'permission',
              id: admin.id,
              title: `Permissões: ${admin.staff?.full_name || 'N/A'}`,
              description: `Papel: ${admin.role} - ${admin.permissions ? Object.keys(admin.permissions).length : 0} permissões`,
              status: admin.is_active ? 'enabled' : 'disabled',
              permissions: admin.permissions ? Object.keys(admin.permissions) : [],
              data: admin
            });
          });
        }
      }

      // Search staff-client assignments if not filtering by type or filtering by assignment
      if (!filters?.type || filters.type === 'assignment') {
        const { data: assignments, error: assignmentError } = await supabase
          .from('staff_client_assignments')
          .select(`
            id,
            staff_id,
            client_id,
            assigned_by,
            assigned_at,
            is_active,
            notes,
            staff:staff_id (
              full_name,
              email,
              position
            ),
            client:client_id (
              company_name,
              contact_person
            )
          `)
          .eq('is_active', true)
          .limit(Math.floor(limit / 4))
          .order('assigned_at', { ascending: false });

        if (assignmentError) {
          console.error('Error searching assignments:', assignmentError);
        } else {
          assignments?.forEach(assignment => {
            const staffName = assignment.staff?.full_name || 'N/A';
            const clientName = assignment.client?.company_name || 'N/A';
            
            // Filter by search term
            if (staffName.toLowerCase().includes(searchTerm) || 
                clientName.toLowerCase().includes(searchTerm) ||
                (assignment.notes && assignment.notes.toLowerCase().includes(searchTerm))) {
              results.push({
                type: 'assignment',
                id: assignment.id,
                title: `Atribuição: ${staffName} → ${clientName}`,
                description: `${assignment.staff?.position || 'N/A'} - Cliente: ${assignment.client?.contact_person || 'N/A'}`,
                status: 'assigned',
                data: assignment
              });
            }
          });
        }
      }

      // Apply status filter if provided
      let filteredResults = results;
      if (filters?.status) {
        filteredResults = results.filter(result => result.status === filters.status);
      }

      console.log('Staff management search results:', filteredResults);
      return filteredResults.slice(0, limit);
    } catch (error) {
      console.error('Staff management search error:', error);
      throw error;
    }
  },

  // Get staff member details
  getStaffMember: async (staffId: string) => {
    console.log('Getting staff member details:', staffId);
    
    try {
      const { data: staff, error } = await supabase
        .from('staff')
        .select(`
          *,
          admin_user:admin_users!admin_users_staff_id_fkey (
            id,
            role,
            permissions,
            is_active
          ),
          client_assignments:staff_client_assignments!staff_client_assignments_staff_id_fkey (
            id,
            client_id,
            assigned_at,
            is_active,
            client:client_id (
              company_name,
              contact_person
            )
          )
        `)
        .eq('id', staffId)
        .single();

      if (error) {
        console.error('Error getting staff member:', error);
        throw error;
      }

      console.log('Successfully retrieved staff member:', staff);
      return staff;
    } catch (error) {
      console.error('Get staff member error:', error);
      throw error;
    }
  },

  // Get all staff members
  getAllStaffMembers: async () => {
    console.log('Getting all staff members');
    
    try {
      const { data: staff, error } = await supabase
        .from('staff')
        .select(`
          id,
          full_name,
          email,
          phone,
          position,
          department,
          hire_date,
          is_active,
          created_at
        `)
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error getting all staff members:', error);
        throw error;
      }

      console.log('Successfully retrieved all staff members:', staff);
      return staff || [];
    } catch (error) {
      console.error('Get all staff members error:', error);
      throw error;
    }
  },

  // Get staff assignments
  getStaffAssignments: async (staffId?: string) => {
    console.log('Getting staff assignments for:', staffId);
    
    try {
      let query = supabase
        .from('staff_client_assignments')
        .select(`
          *,
          staff:staff_id (
            full_name,
            email,
            position
          ),
          client:client_id (
            company_name,
            contact_person,
            email
          )
        `)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data: assignments, error } = await query;

      if (error) {
        console.error('Error getting staff assignments:', error);
        throw error;
      }

      console.log('Successfully retrieved staff assignments:', assignments);
      return assignments || [];
    } catch (error) {
      console.error('Get staff assignments error:', error);
      throw error;
    }
  },

  // Get permission summary
  getPermissionsSummary: async () => {
    console.log('Getting permissions summary');
    
    try {
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select(`
          id,
          role,
          permissions,
          is_active,
          staff:staff_id (
            full_name,
            position
          )
        `)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (error) {
        console.error('Error getting permissions summary:', error);
        throw error;
      }

      console.log('Successfully retrieved permissions summary:', adminUsers);
      return adminUsers || [];
    } catch (error) {
      console.error('Get permissions summary error:', error);
      throw error;
    }
  }
};