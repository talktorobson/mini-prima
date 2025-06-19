// 🤖 Case Workflow Automation Component
// D'Avila Reis Legal Practice Management System
// Advanced case automation with Brazilian legal procedures

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Workflow,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  FileText,
  Users,
  Gavel,
  Settings,
  Target,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { brazilianLegalService, LEGAL_PROCEDURE_TYPES } from '@/services/brazilianLegalService';
import { supabase } from '@/integrations/supabase/client';

interface WorkflowPhase {
  id: string;
  phase_name: string;
  phase_order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  estimated_start_date: string;
  actual_start_date?: string;
  estimated_end_date?: string;
  actual_end_date?: string;
  description?: string;
  required_documents: string[];
}

interface AutomatedCase {
  id: string;
  case_title: string;
  procedure_type: string;
  workflow_phases: WorkflowPhase[];
  progress_percentage: number;
  estimated_completion: string;
  client_name: string;
}

interface CaseWorkflowAutomationProps {
  caseId?: string;
  onWorkflowCreated?: () => void;
}

export const CaseWorkflowAutomation: React.FC<CaseWorkflowAutomationProps> = ({
  caseId,
  onWorkflowCreated
}) => {
  const { toast } = useToast();
  const [automatedCases, setAutomatedCases] = useState<AutomatedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    case_id: caseId || '',
    procedure_type: '',
    description: ''
  });

  useEffect(() => {
    loadAutomatedCases();
  }, []);

  const loadAutomatedCases = async () => {
    try {
      setLoading(true);
      
      // Get cases with automated workflows
      const { data: cases, error } = await supabase
        .from('cases')
        .select(`
          id,
          case_title,
          procedure_type,
          progress_percentage,
          estimated_duration_days,
          client:clients(company_name),
          case_workflow_phases(*)
        `)
        .eq('workflow_automated', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCases: AutomatedCase[] = cases?.map(case_ => {
        const phases = case_.case_workflow_phases || [];
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(estimatedCompletion.getDate() + (case_.estimated_duration_days || 365));

        return {
          id: case_.id,
          case_title: case_.case_title,
          procedure_type: case_.procedure_type || 'CIVIL_ORDINARY',
          workflow_phases: phases,
          progress_percentage: case_.progress_percentage || 0,
          estimated_completion: estimatedCompletion.toISOString().split('T')[0],
          client_name: (case_.client as any)?.company_name || 'Cliente não informado'
        };
      }) || [];

      setAutomatedCases(transformedCases);
    } catch (error) {
      console.error('Error loading automated cases:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar casos automatizados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.case_id || !newWorkflow.procedure_type) {
      toast({
        title: 'Erro',
        description: 'Selecione um caso e tipo de procedimento',
        variant: 'destructive'
      });
      return;
    }

    try {
      await brazilianLegalService.automateCaseWorkflow(
        newWorkflow.case_id,
        newWorkflow.procedure_type as keyof typeof LEGAL_PROCEDURE_TYPES
      );

      toast({
        title: 'Workflow Criado',
        description: 'Workflow automatizado criado com sucesso',
      });

      setShowCreateDialog(false);
      setNewWorkflow({ case_id: caseId || '', procedure_type: '', description: '' });
      loadAutomatedCases();
      onWorkflowCreated?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar workflow automatizado',
        variant: 'destructive'
      });
    }
  };

  const handleAdvancePhase = async (caseId: string, phaseId: string) => {
    try {
      await supabase
        .from('case_workflow_phases')
        .update({
          status: 'completed',
          actual_end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', phaseId);

      // Activate next phase
      const caseData = automatedCases.find(c => c.id === caseId);
      if (caseData) {
        const currentPhase = caseData.workflow_phases.find(p => p.id === phaseId);
        if (currentPhase) {
          const nextPhase = caseData.workflow_phases.find(
            p => p.phase_order === currentPhase.phase_order + 1
          );
          
          if (nextPhase) {
            await supabase
              .from('case_workflow_phases')
              .update({
                status: 'active',
                actual_start_date: new Date().toISOString().split('T')[0]
              })
              .eq('id', nextPhase.id);
          }
        }
      }

      toast({
        title: 'Fase Avançada',
        description: 'Fase do workflow concluída com sucesso',
      });

      loadAutomatedCases();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao avançar fase do workflow',
        variant: 'destructive'
      });
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />;
      case 'skipped':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="h-6 w-6 text-blue-600" />
            Automação de Workflows
          </h2>
          <p className="text-gray-600">
            Gestão automatizada de processos legais brasileiros
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Workflow Automatizado</DialogTitle>
              <DialogDescription>
                Configure um workflow automatizado para um caso específico
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="case_id">Caso *</Label>
                <Input
                  id="case_id"
                  value={newWorkflow.case_id}
                  onChange={(e) => setNewWorkflow({...newWorkflow, case_id: e.target.value})}
                  placeholder="ID do caso"
                  disabled={!!caseId}
                />
              </div>

              <div>
                <Label htmlFor="procedure_type">Tipo de Procedimento *</Label>
                <Select
                  value={newWorkflow.procedure_type}
                  onValueChange={(value) => setNewWorkflow({...newWorkflow, procedure_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de procedimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEGAL_PROCEDURE_TYPES).map(([key, procedure]) => (
                      <SelectItem key={key} value={key}>
                        {procedure.name} ({procedure.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                  placeholder="Descrição adicional do workflow"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateWorkflow}>
                  <Workflow className="h-4 w-4 mr-2" />
                  Criar Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Automated Cases List */}
      {automatedCases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum workflow automatizado
            </h3>
            <p className="text-gray-600 mb-4">
              Crie workflows automatizados para gerenciar seus casos de forma eficiente
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {automatedCases.map((caseData) => (
            <Card key={caseData.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{caseData.case_title}</CardTitle>
                    <CardDescription>
                      Cliente: {caseData.client_name} • 
                      Tipo: {LEGAL_PROCEDURE_TYPES[caseData.procedure_type as keyof typeof LEGAL_PROCEDURE_TYPES]?.name || caseData.procedure_type}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Progresso</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {caseData.progress_percentage}%
                    </div>
                  </div>
                </div>
                <Progress value={caseData.progress_percentage} className="mt-2" />
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Conclusão estimada:</span>
                      <span className="ml-2 font-medium">
                        {new Date(caseData.estimated_completion).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fases totais:</span>
                      <span className="ml-2 font-medium">{caseData.workflow_phases.length}</span>
                    </div>
                  </div>

                  {/* Workflow Phases */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Fases do Processo</h4>
                    {caseData.workflow_phases.map((phase, index) => (
                      <div key={phase.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getPhaseStatusIcon(phase.status)}
                          <span className="text-sm font-medium">{phase.phase_order}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{phase.phase_name}</span>
                            <Badge className={getPhaseStatusColor(phase.status)}>
                              {phase.status === 'completed' ? 'Concluída' :
                               phase.status === 'active' ? 'Ativa' :
                               phase.status === 'pending' ? 'Pendente' : 'Pulada'}
                            </Badge>
                          </div>
                          
                          {phase.description && (
                            <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                          )}
                          
                          {phase.required_documents.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {phase.required_documents.map((doc, docIndex) => (
                                <Badge key={docIndex} variant="outline" className="text-xs">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-sm text-gray-600">
                          {phase.actual_start_date && (
                            <div>Iniciada: {new Date(phase.actual_start_date).toLocaleDateString('pt-BR')}</div>
                          )}
                          {phase.estimated_start_date && !phase.actual_start_date && (
                            <div>Prevista: {new Date(phase.estimated_start_date).toLocaleDateString('pt-BR')}</div>
                          )}
                        </div>

                        {phase.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvancePhase(caseData.id, phase.id)}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Avançar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Case Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      Ver Prazos
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-3 w-3 mr-1" />
                      Documentos
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaseWorkflowAutomation;