
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface StaffAssignedClient {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  status: string;
}

interface StaffInfo {
  staff_id: string;
  full_name: string;
  email: string;
  staff_position: string;
  role: string;
}

export const useStaffData = () => {
  const [assignedClients, setAssignedClients] = useState<StaffAssignedClient[]>([]);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { adminUser } = useAdminAuth();

  useEffect(() => {
    if (adminUser && adminUser.role === 'staff') {
      fetchStaffData();
    } else {
      setLoading(false);
    }
  }, [adminUser]);

  const fetchStaffData = async () => {
    try {
      setLoading(true);

      // Fetch staff info
      const { data: staffData, error: staffError } = await supabase
        .rpc('get_staff_info');

      if (staffError) {
        console.error('Error fetching staff info:', staffError);
      } else if (staffData && staffData.length > 0) {
        setStaffInfo(staffData[0]);
      }

      // Fetch assigned clients
      const { data: clientData, error: clientError } = await supabase
        .rpc('get_staff_assigned_clients');

      if (clientError) {
        console.error('Error fetching assigned clients:', clientError);
      } else if (clientData) {
        // Fetch full client details
        const clientIds = clientData.map((c: any) => c.client_id);
        
        if (clientIds.length > 0) {
          const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, company_name, contact_person, email, status')
            .in('id', clientIds);

          if (clientsError) {
            console.error('Error fetching client details:', clientsError);
          } else {
            setAssignedClients(clients || []);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isStaff = adminUser?.role === 'staff';
  const hasAssignedClients = assignedClients.length > 0;

  return {
    assignedClients,
    staffInfo,
    loading,
    isStaff,
    hasAssignedClients,
    refetch: fetchStaffData
  };
};
