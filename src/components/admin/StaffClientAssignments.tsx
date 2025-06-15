
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Users, Building, Plus, Trash2, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  position: string;
  status: string;
}

interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  status: string;
}

interface Assignment {
  id: string;
  staff_id: string;
  client_id: string;
  assigned_at: string;
  notes?: string;
  staff: StaffMember;
  client: Client;
}

const StaffClientAssignments = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchStaffMembers(),
      fetchClients(),
      fetchAssignments()
    ]);
  };

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

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, contact_person, email, status')
        .eq('status', 'Active');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      });
    }
  };

  const fetchAssignments = async () => {
    try {
      // Using type assertion to work around TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('staff_client_assignments')
        .select(`
          id,
          staff_id,
          client_id,
          assigned_at,
          notes,
          staff:staff_id (
            id,
            full_name,
            email,
            position,
            status
          ),
          client:client_id (
            id,
            company_name,
            contact_person,
            email,
            status
          )
        `)
        .eq('is_active', true);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
    }
  };

  const getStaffAssignments = (staffId: string) => {
    return assignments
      .filter(a => a.staff_id === staffId)
      .map(a => a.client);
  };

  const getClientAssignments = (clientId: string) => {
    return assignments
      .filter(a => a.client_id === clientId)
      .map(a => a.staff);
  };

  const handleClientSelection = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  const createAssignments = async () => {
    if (!selectedStaff || selectedClients.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione um funcionário e pelo menos um cliente",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Usuário não autenticado');

      const assignmentsToCreate = selectedClients.map(clientId => ({
        staff_id: selectedStaff,
        client_id: clientId,
        assigned_by: currentUser.user.id,
        notes: notes || null,
        is_active: true
      }));

      const { error } = await (supabase as any)
        .from('staff_client_assignments')
        .insert(assignmentsToCreate);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Atribuições criadas com sucesso"
      });

      fetchAssignments();
      setSelectedStaff('');
      setSelectedClients([]);
      setNotes('');
    } catch (error: any) {
      console.error('Error creating assignments:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar atribuições",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('staff_client_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Atribuição removida com sucesso"
      });

      fetchAssignments();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover atribuição",
        variant: "destructive"
      });
    }
  };

  const getAvailableClients = () => {
    if (!selectedStaff) return clients;
    
    const assignedClientIds = getStaffAssignments(selectedStaff).map(c => c.id);
    return clients.filter(c => !assignedClientIds.includes(c.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Atribuições Funcionário-Cliente
          </CardTitle>
          <CardDescription>
            Gerencie quais funcionários têm acesso a quais clientes e seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nova Atribuição</h3>
            
            <div className="space-y-2">
              <Label htmlFor="staff-select">Selecionar Funcionário</Label>
              <select
                id="staff-select"
                className="w-full p-2 border rounded-md"
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value);
                  setSelectedClients([]);
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

            {selectedStaff && (
              <div className="space-y-3">
                <Label>Clientes Disponíveis</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {getAvailableClients().map(client => (
                    <div key={client.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`client-${client.id}`}
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => handleClientSelection(client.id, e.target.checked)}
                        className="rounded"
                      />
                      <Label 
                        htmlFor={`client-${client.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <div className="font-medium">{client.company_name}</div>
                          <div className="text-sm text-gray-600">{client.contact_person}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
                
                {getAvailableClients().length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Este funcionário já tem acesso a todos os clientes disponíveis.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <textarea
                id="notes"
                className="w-full p-2 border rounded-md"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre esta atribuição..."
              />
            </div>

            <Button 
              onClick={createAssignments}
              disabled={loading || !selectedStaff || selectedClients.length === 0}
              className="w-full"
            >
              {loading ? 'Criando...' : 'Criar Atribuições'}
            </Button>
          </div>

          <Separator />

          {/* Current Assignments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Atribuições Atuais</h3>
            
            {staffMembers.map(staff => {
              const staffAssignments = assignments.filter(a => a.staff_id === staff.id);
              if (staffAssignments.length === 0) return null;

              return (
                <Card key={staff.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{staff.full_name}</h4>
                        <p className="text-sm text-gray-600">{staff.position}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{staffAssignments.length} clientes</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {staffAssignments.map(assignment => (
                      <div 
                        key={assignment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-sm">{assignment.client.company_name}</div>
                            <div className="text-xs text-gray-600">{assignment.client.contact_person}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            
            {assignments.length === 0 && (
              <Alert>
                <AlertDescription>
                  Nenhuma atribuição foi criada ainda.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffClientAssignments;
