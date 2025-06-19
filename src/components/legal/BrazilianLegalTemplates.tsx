// 📄 Brazilian Legal Templates Manager
// D'Avila Reis Legal Practice Management System
// Professional legal document templates with automated generation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Trash2,
  BookOpen,
  Gavel,
  Building2,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LegalTemplate {
  id: string;
  template_name: string;
  template_type: 'petition' | 'contract' | 'motion' | 'defense' | 'appeal' | 'agreement';
  practice_area: 'civil' | 'labor' | 'corporate' | 'criminal' | 'administrative';
  court_type?: string;
  template_content: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateGeneration {
  template_id: string;
  case_id?: string;
  client_id?: string;
  variable_values: Record<string, string>;
  generated_content: string;
}

const TEMPLATE_TYPES = {
  petition: { name: 'Petição Inicial', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  contract: { name: 'Contrato', icon: Building2, color: 'bg-green-100 text-green-800' },
  motion: { name: 'Petição Simples', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  defense: { name: 'Defesa/Contestação', icon: Gavel, color: 'bg-orange-100 text-orange-800' },
  appeal: { name: 'Recurso', icon: FileText, color: 'bg-red-100 text-red-800' },
  agreement: { name: 'Acordo', icon: Users, color: 'bg-yellow-100 text-yellow-800' }
};

const PRACTICE_AREAS = {
  civil: { name: 'Direito Civil', color: 'bg-blue-100 text-blue-800' },
  labor: { name: 'Direito Trabalhista', color: 'bg-green-100 text-green-800' },
  corporate: { name: 'Direito Empresarial', color: 'bg-purple-100 text-purple-800' },
  criminal: { name: 'Direito Criminal', color: 'bg-red-100 text-red-800' },
  administrative: { name: 'Direito Administrativo', color: 'bg-orange-100 text-orange-800' }
};

export const BrazilianLegalTemplates: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    template_type: 'petition',
    practice_area: 'civil',
    court_type: '',
    template_content: '',
  });
  const [generationForm, setGenerationForm] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('legal_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const templatesWithVariables: LegalTemplate[] = data?.map(template => ({
        ...template,
        variables: extractVariables(template.template_content)
      })) || [];

      setTemplates(templatesWithVariables);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name || !newTemplate.template_content) {
      toast({
        title: 'Erro',
        description: 'Nome e conteúdo do template são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      const variables = extractVariables(newTemplate.template_content);
      
      const { error } = await supabase
        .from('legal_templates')
        .insert({
          template_name: newTemplate.template_name,
          template_type: newTemplate.template_type,
          practice_area: newTemplate.practice_area,
          court_type: newTemplate.court_type || null,
          template_content: newTemplate.template_content,
          variables: JSON.stringify(variables),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Template Criado',
        description: 'Template legal criado com sucesso',
      });

      setShowCreateDialog(false);
      setNewTemplate({
        template_name: '',
        template_type: 'petition',
        practice_area: 'civil',
        court_type: '',
        template_content: '',
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar template',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) return;

    try {
      let generatedContent = selectedTemplate.template_content;
      
      // Replace variables with values
      selectedTemplate.variables.forEach(variable => {
        const value = generationForm[variable] || `{${variable}}`;
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        generatedContent = generatedContent.replace(regex, value);
      });

      // Create a downloadable document
      const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedTemplate.template_name}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Documento Gerado',
        description: 'Documento gerado e baixado com sucesso',
      });

      setShowGenerateDialog(false);
      setGenerationForm({});
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar documento',
        variant: 'destructive'
      });
    }
  };

  const handlePreviewTemplate = (template: LegalTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize generation form with empty values
    const initialForm: Record<string, string> = {};
    template.variables.forEach(variable => {
      initialForm[variable] = '';
    });
    setGenerationForm(initialForm);
    setShowGenerateDialog(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template_content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.template_type === filterType;
    const matchesArea = filterArea === 'all' || template.practice_area === filterArea;
    
    return matchesSearch && matchesType && matchesArea;
  });

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
            <BookOpen className="h-6 w-6 text-blue-600" />
            Templates Legais Brasileiros
          </h2>
          <p className="text-gray-600">
            Biblioteca de documentos jurídicos padronizados
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Template Legal</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para documentos jurídicos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_name">Nome do Template *</Label>
                  <Input
                    id="template_name"
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate({...newTemplate, template_name: e.target.value})}
                    placeholder="Ex: Petição Inicial Trabalhista"
                  />
                </div>

                <div>
                  <Label htmlFor="court_type">Tribunal</Label>
                  <Input
                    id="court_type"
                    value={newTemplate.court_type}
                    onChange={(e) => setNewTemplate({...newTemplate, court_type: e.target.value})}
                    placeholder="Ex: TJSP, TRT2, STJ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_type">Tipo de Documento *</Label>
                  <Select
                    value={newTemplate.template_type}
                    onValueChange={(value) => setNewTemplate({...newTemplate, template_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="practice_area">Área do Direito *</Label>
                  <Select
                    value={newTemplate.practice_area}
                    onValueChange={(value) => setNewTemplate({...newTemplate, practice_area: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRACTICE_AREAS).map(([key, area]) => (
                        <SelectItem key={key} value={key}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="template_content">Conteúdo do Template *</Label>
                <Textarea
                  id="template_content"
                  value={newTemplate.template_content}
                  onChange={(e) => setNewTemplate({...newTemplate, template_content: e.target.value})}
                  placeholder="Use {VARIAVEL} para campos substituíveis. Ex: {NOME_CLIENTE}, {VALOR_CAUSA}, {DATA}"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use chaves {} para definir variáveis substituíveis. Ex: {'{NOME_CLIENTE}'}, {'{VALOR_CAUSA}'}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTemplate}>
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TEMPLATE_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Área do direito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as áreas</SelectItem>
                {Object.entries(PRACTICE_AREAS).map(([key, area]) => (
                  <SelectItem key={key} value={key}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterArea !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Crie seu primeiro template legal'}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const templateType = TEMPLATE_TYPES[template.template_type as keyof typeof TEMPLATE_TYPES];
            const practiceArea = PRACTICE_AREAS[template.practice_area as keyof typeof PRACTICE_AREAS];
            const TemplateIcon = templateType.icon;

            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TemplateIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-lg">{template.template_name}</CardTitle>
                        <CardDescription>
                          {template.court_type && `${template.court_type} • `}
                          {template.variables.length} variáveis
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={templateType.color}>
                      {templateType.name}
                    </Badge>
                    <Badge className={practiceArea.color}>
                      {practiceArea.name}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p className="line-clamp-3">{template.template_content.substring(0, 150)}...</p>
                    </div>
                    
                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Variáveis:</p>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.slice(0, 3).map((variable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                          {template.variables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Gerar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Generation Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gerar Documento: {selectedTemplate?.template_name}</DialogTitle>
            <DialogDescription>
              Preencha as variáveis para gerar o documento personalizado
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <Tabs defaultValue="variables" className="space-y-4">
              <TabsList>
                <TabsTrigger value="variables">Variáveis</TabsTrigger>
                <TabsTrigger value="preview">Visualizar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="variables" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable}>
                      <Label htmlFor={variable}>{variable.replace(/_/g, ' ')}</Label>
                      <Input
                        id={variable}
                        value={generationForm[variable] || ''}
                        onChange={(e) => setGenerationForm({
                          ...generationForm,
                          [variable]: e.target.value
                        })}
                        placeholder={`Digite ${variable.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {(() => {
                      let preview = selectedTemplate.template_content;
                      selectedTemplate.variables.forEach(variable => {
                        const value = generationForm[variable] || `[${variable}]`;
                        const regex = new RegExp(`\\{${variable}\\}`, 'g');
                        preview = preview.replace(regex, value);
                      });
                      return preview;
                    })()}
                  </pre>
                </div>
              </TabsContent>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleGenerateDocument}>
                  <Download className="h-4 w-4 mr-2" />
                  Gerar e Baixar
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrazilianLegalTemplates;