
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, FileText, DollarSign, MessageCircle, Settings, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  position: string;
  status: string;
}

interface AccessPermission {
  id: string;
  staff_id: string;
  access_type: string;
  is_active: boolean;
  granted_by: string;
  granted_at: string;
}

const accessTypes = [
  { value: 'client_access', label: 'Client Access', icon: User, description: 'Access to client portal and data' },
  { value: 'billing', label: 'Billing', icon: DollarSign, description: 'Financial records and billing management' },
  { value: 'messaging', label: 'Messaging', icon: MessageCircle, description: 'Portal messaging and communications' },
  { value: 'cases_management', label: 'Cases Management', icon: FileText, description: 'Case files and legal documents' },
  { value: 'document_management', label: 'Document Management', icon: FileText, description: 'Document storage and access' },
  { value: 'system_setup', label: 'System Setup', icon: Settings, description: 'System configuration and admin settings' }
];

const PermissionManager = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [permissions, setPermissions] = useState<AccessPermission[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffMembers();
    fetchPermissions();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, email, position, status')
        .eq('status', 'Active');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar equipe",
        variant: "destructive"
      });
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_access_permissions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
    }
  };

  const getStaffPermissions = (staffId: string) => {
    return permissions
      .filter(p => p.staff_id === staffId)
      .map(p => p.access_type);
  };

  const handlePermissionChange = (accessType: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, accessType]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== accessType));
    }
  };

  const grantPermissions = async () => {
    if (!selectedStaff || selectedPermissions.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione um funcionário e pelo menos uma permissão",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      // Remove existing permissions first
      await supabase
        .from('staff_access_permissions')
        .delete()
        .eq('staff_id', selectedStaff);

      // Add new permissions
      const permissionsToInsert = selectedPermissions.map(accessType => ({
        staff_id: selectedStaff,
        access_type: accessType,
        granted_by: currentUser.user.id,
        is_active: true
      }));

      const { error } = await supabase
        .from('staff_access_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso"
      });

      fetchPermissions();
      setSelectedStaff('');
      setSelectedPermissions([]);
    } catch (error: any) {
      console.error('Error granting permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokePermission = async (staffId: string, accessType: string) => {
    try {
      const { error } = await supabase
        .from('staff_access_permissions')
        .delete()
        .eq('staff_id', staffId)
        .eq('access_type', accessType);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão removida com sucesso"
      });

      fetchPermissions();
    } catch (error: any) {
      console.error('Error revoking permission:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover permissão",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento de Permissões
          </CardTitle>
          <CardDescription>
            Gerencie as permissões de acesso da equipe ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grant Permissions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Conceder Permissões</h3>
            
            <div className="space-y-2">
              <Label htmlFor="staff-select">Selecionar Funcionário</Label>
              <select
                id="staff-select"
                className="w-full p-2 border rounded-md"
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value);
                  if (e.target.value) {
                    setSelectedPermissions(getStaffPermissions(e.target.value));
                  }
                }}
              >
                <option value="">Selecione um funcionário</option>
                {staffMembers.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} - {staff.position}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>Tipos de Acesso</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accessTypes.map(accessType => {
                  const Icon = accessType.icon;
                  return (
                    <div key={accessType.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={accessType.value}
                        checked={selectedPermissions.includes(accessType.value)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(accessType.value, !!checked)
                        }
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={accessType.value}
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          {accessType.label}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {accessType.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button 
              onClick={grantPermissions}
              disabled={loading || !selectedStaff || selectedPermissions.length === 0}
              className="w-full"
            >
              {loading ? 'Atualizando...' : 'Atualizar Permissões'}
            </Button>
          </div>

          <Separator />

          {/* Current Permissions Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Permissões Atuais</h3>
            
            {staffMembers.map(staff => {
              const staffPermissions = getStaffPermissions(staff.id);
              if (staffPermissions.length === 0) return null;

              return (
                <Card key={staff.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{staff.full_name}</h4>
                      <p className="text-sm text-gray-600">{staff.position}</p>
                    </div>
                    <Badge variant="outline">{staffPermissions.length} permissões</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {staffPermissions.map(permissionType => {
                      const accessType = accessTypes.find(at => at.value === permissionType);
                      if (!accessType) return null;
                      
                      const Icon = accessType.icon;
                      return (
                        <Badge 
                          key={permissionType} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          <Icon className="h-3 w-3" />
                          {accessType.label}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => revokePermission(staff.id, permissionType)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
            
            {permissions.length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhuma permissão foi concedida ainda.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManager;
