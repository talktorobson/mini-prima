import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Download, 
  ExternalLink,
  Check,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Share,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googleDocsService, DocumentTemplate, DocumentGeneration, TemplateVariable } from '@/services/googleDocsService';

export default function DocumentGeneration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [generations, setGenerations] = useState<DocumentGeneration[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [generationForm, setGenerationForm] = useState({
    document_name: '',
    case_id: '',
    client_id: '',
    variable_values: {} as Record<string, any>,
  });

  // Mock data for dropdowns
  const [cases, setCases] = useState([
    { id: '1', case_number: '001/2024', title: 'Caso Empresa ABC', client_name: 'ABC Ltda' },
    { id: '2', case_number: '002/2024', title: 'Caso Empresa XYZ', client_name: 'XYZ S.A.' },
  ]);

  const [clients, setClients] = useState([
    { id: '1', company_name: 'ABC Ltda' },
    { id: '2', company_name: 'XYZ S.A.' },
    { id: '3', company_name: '123 Indústria' },
  ]);

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, generationsData] = await Promise.all([
        googleDocsService.getDocumentTemplates(),
        googleDocsService.getDocumentGenerations(),
      ]);
      
      setTemplates(templatesData);
      setGenerations(generationsData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startGeneration = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setGenerationForm({
      document_name: `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
      case_id: '',
      client_id: '',
      variable_values: template.default_values || {},
    });
    setShowGenerationForm(true);
  };

  const generateDocument = async () => {
    if (!selectedTemplate) return;

    // Validate required variables
    for (const variable of selectedTemplate.variables) {
      if (variable.required && !generationForm.variable_values[variable.name]) {
        toast({
          title: 'Erro',
          description: `${variable.label} é obrigatório`,
          variant: 'destructive',
        });
        return;
      }

      // Validate variable values
      const validation = googleDocsService.validateVariableValue(
        variable, 
        generationForm.variable_values[variable.name]
      );
      
      if (!validation.valid) {
        toast({
          title: 'Erro',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setGenerating(true);
      
      const generation = await googleDocsService.generateDocument(
        selectedTemplate.id,
        generationForm.variable_values,
        {
          document_name: generationForm.document_name,
          case_id: generationForm.case_id || undefined,
          client_id: generationForm.client_id || undefined,
        }
      );

      toast({
        title: 'Sucesso',
        description: 'Documento gerado com sucesso',
      });

      setShowGenerationForm(false);
      setSelectedTemplate(null);
      await loadData();

      // Open Google Docs for editing if available
      if (generation.google_doc_edit_url) {
        window.open(generation.google_doc_edit_url, '_blank');
      }

    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar documento',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = async (generationId: string) => {
    try {
      const pdfUrl = await googleDocsService.exportToPDF(generationId);
      
      toast({
        title: 'Sucesso',
        description: 'PDF gerado com sucesso',
      });

      // Download PDF
      window.open(pdfUrl, '_blank');
      await loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF',
        variant: 'destructive',
      });
    }
  };

  const updateGenerationStatus = async (generationId: string, status: string, stage?: string) => {
    try {
      await googleDocsService.updateGenerationStatus(generationId, status, stage);
      await loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'editing': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'finalized': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'editing': return 'Em Edição';
      case 'review': return 'Em Revisão';
      case 'finalized': return 'Finalizado';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  const getWorkflowStageLabel = (stage: string) => {
    switch (stage) {
      case 'created': return 'Criado';
      case 'variables_filled': return 'Variáveis Preenchidas';
      case 'doc_generated': return 'Documento Gerado';
      case 'staff_editing': return 'Em Edição';
      case 'pdf_exported': return 'PDF Exportado';
      default: return stage;
    }
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = generationForm.variable_values[variable.name] || '';
    
    const updateValue = (newValue: any) => {
      setGenerationForm(prev => ({
        ...prev,
        variable_values: {
          ...prev.variable_values,
          [variable.name]: newValue,
        },
      }));
    };

    switch (variable.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={variable.placeholder}
            rows={3}
            required={variable.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            required={variable.required}
          />
        );
      
      case 'currency':
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={variable.placeholder}
            required={variable.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={variable.placeholder}
            required={variable.required}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={updateValue}>
            <SelectTrigger>
              <SelectValue placeholder={variable.placeholder || 'Selecione uma opção'} />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={variable.placeholder}
            required={variable.required}
          />
        );
    }
  };

  const filteredGenerations = generations.filter(gen => {
    const matchesSearch = gen.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gen.template_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gen.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Geração de Documentos</h1>
        </div>
        <Badge variant="secondary">PDF Export System</Badge>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">
            Templates Disponíveis ({templates.length})
          </TabsTrigger>
          <TabsTrigger value="generations">
            Documentos Gerados ({generations.length})
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhum template disponível
                </h3>
                <p className="text-gray-500">
                  Entre em contato com o administrador para criar templates de documentos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.google_doc_id && (
                          <Badge variant="outline" className="text-green-600">
                            Google Docs
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{template.variables.length}</span> variáveis
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => startGeneration(template)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Gerar Documento
                        </Button>
                        
                        {template.google_doc_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(template.google_doc_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Generations Tab */}
        <TabsContent value="generations" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="editing">Em Edição</SelectItem>
                      <SelectItem value="review">Em Revisão</SelectItem>
                      <SelectItem value="finalized">Finalizado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Documents */}
          {filteredGenerations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'Nenhum documento encontrado' : 'Nenhum documento gerado'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Gere seu primeiro documento usando um template'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredGenerations.map((generation) => (
                <Card key={generation.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{generation.document_name}</h3>
                          <Badge className={getStatusColor(generation.status)}>
                            {getStatusLabel(generation.status)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Template:</span> {generation.template_name}</p>
                          <p><span className="font-medium">Criado em:</span> {new Date(generation.created_at).toLocaleDateString('pt-BR')}</p>
                          <p><span className="font-medium">Etapa:</span> {getWorkflowStageLabel(generation.workflow_stage)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {generation.google_doc_edit_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generation.google_doc_edit_url, '_blank')}
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        )}

                        {generation.workflow_stage === 'doc_generated' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateGenerationStatus(generation.id, 'editing', 'staff_editing')}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Iniciar Edição
                          </Button>
                        )}

                        {generation.status === 'editing' && (
                          <Button
                            size="sm"
                            onClick={() => exportToPDF(generation.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Exportar PDF
                          </Button>
                        )}

                        {generation.pdf_file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(generation.pdf_file_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Generation Form Modal */}
      {showGenerationForm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Gerar Documento: {selectedTemplate.name}</CardTitle>
              <CardDescription>
                Preencha as informações para gerar o documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Document Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_name">Nome do Documento</Label>
                  <Input
                    id="document_name"
                    value={generationForm.document_name}
                    onChange={(e) => setGenerationForm(prev => ({ ...prev, document_name: e.target.value }))}
                    placeholder="Nome para identificar este documento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case_id">Processo (opcional)</Label>
                  <Select
                    value={generationForm.case_id}
                    onValueChange={(value) => setGenerationForm(prev => ({ ...prev, case_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um processo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum processo</SelectItem>
                      {cases.map((case_) => (
                        <SelectItem key={case_.id} value={case_.id}>
                          {case_.case_number} - {case_.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="client_id">Cliente (opcional)</Label>
                  <Select
                    value={generationForm.client_id}
                    onValueChange={(value) => setGenerationForm(prev => ({ ...prev, client_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Template Variables */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-t pt-4">
                    Variáveis do Template ({selectedTemplate.variables.length})
                  </h4>
                  
                  <div className="space-y-4">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable.name} className="space-y-2">
                        <Label htmlFor={variable.name}>
                          {variable.label}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderVariableInput(variable)}
                        {variable.type === 'currency' && (
                          <p className="text-xs text-gray-500">Valor em reais (R$)</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGenerationForm(false);
                    setSelectedTemplate(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={generateDocument} disabled={generating}>
                  {generating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Gerar Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}