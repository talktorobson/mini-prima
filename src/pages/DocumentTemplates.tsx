import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  FileText, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Copy,
  Save,
  X,
  RefreshCw,
  Settings,
  Search,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googleDocsService, DocumentTemplate, TemplateVariable } from '@/services/googleDocsService';

export default function DocumentTemplates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DocumentTemplate[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    practice_area: '',
    google_doc_url: '',
    variables: [] as TemplateVariable[],
  });

  // Variable form state
  const [variableForm, setVariableForm] = useState<TemplateVariable>({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchTerm, categoryFilter]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await googleDocsService.getDocumentTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    setFilteredTemplates(filtered);
  };

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      practice_area: '',
      google_doc_url: '',
      variables: [],
    });
    setVariableForm({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    });
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  const startEdit = (template: DocumentTemplate) => {
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      practice_area: '',
      google_doc_url: template.google_doc_url || '',
      variables: template.variables,
    });
    setEditingTemplate(template);
    setShowCreateForm(true);
  };

  const addVariable = () => {
    if (!variableForm.name || !variableForm.label) {
      toast({
        title: 'Erro',
        description: 'Nome e rótulo da variável são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate variable names
    if (templateForm.variables.some(v => v.name === variableForm.name)) {
      toast({
        title: 'Erro',
        description: 'Já existe uma variável com este nome',
        variant: 'destructive',
      });
      return;
    }

    setTemplateForm(prev => ({
      ...prev,
      variables: [...prev.variables, { ...variableForm }],
    }));

    setVariableForm({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    });
  };

  const removeVariable = (index: number) => {
    setTemplateForm(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index),
    }));
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.category) {
      toast({
        title: 'Erro',
        description: 'Nome e categoria são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingTemplate) {
        await googleDocsService.updateTemplate(editingTemplate.id, templateForm);
        toast({
          title: 'Sucesso',
          description: 'Template atualizado com sucesso',
        });
      } else {
        await googleDocsService.createTemplate(templateForm);
        toast({
          title: 'Sucesso',
          description: 'Template criado com sucesso',
        });
      }

      resetForm();
      await loadTemplates();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await googleDocsService.deleteTemplate(templateId);
      toast({
        title: 'Sucesso',
        description: 'Template excluído com sucesso',
      });
      await loadTemplates();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir template',
        variant: 'destructive',
      });
    }
  };

  const duplicateTemplate = async (template: DocumentTemplate) => {
    const newTemplate = {
      ...template,
      name: `${template.name} (Cópia)`,
    };
    delete (newTemplate as any).id;

    try {
      await googleDocsService.createTemplate(newTemplate);
      toast({
        title: 'Sucesso',
        description: 'Template duplicado com sucesso',
      });
      await loadTemplates();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao duplicar template',
        variant: 'destructive',
      });
    }
  };

  const categories = googleDocsService.getTemplateCategories();
  const practiceAreas = googleDocsService.getPracticeAreas();

  const getVariableTypeLabel = (type: string) => {
    const types = {
      text: 'Texto',
      textarea: 'Texto Longo',
      date: 'Data',
      currency: 'Moeda',
      number: 'Número',
      select: 'Seleção',
    };
    return types[type as keyof typeof types] || type;
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Templates de Documentos
          </h1>
          <p className="text-gray-600">
            Gerencie templates de documentos com integração Google Docs
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || categoryFilter !== 'all' ? 'Nenhum template encontrado' : 'Nenhum template criado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro template de documento'
              }
            </p>
            {!searchTerm && categoryFilter === 'all' && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(template)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateTemplate(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {categories.find(c => c.value === template.category)?.label || template.category}
                    </Badge>
                    {template.google_doc_id && (
                      <Badge variant="outline" className="text-green-600">
                        Google Docs
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{template.variables.length}</span> variáveis configuradas
                  </div>

                  {template.google_doc_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(template.google_doc_url, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Ver no Google Docs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {editingTemplate ? 'Editar Template' : 'Novo Template'}
                  </CardTitle>
                  <CardDescription>
                    Configure o template e suas variáveis dinâmicas
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="variables">
                    Variáveis ({templateForm.variables.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">Nome do Template *</Label>
                      <Input
                        id="template_name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Contrato de Prestação de Serviços"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template_category">Categoria *</Label>
                      <Select
                        value={templateForm.category}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="template_description">Descrição</Label>
                      <Textarea
                        id="template_description"
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva para que serve este template..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="practice_area">Área de Atuação</Label>
                      <Select
                        value={templateForm.practice_area}
                        onValueChange={(value) => setTemplateForm(prev => ({ ...prev, practice_area: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a área" />
                        </SelectTrigger>
                        <SelectContent>
                          {practiceAreas.map((area) => (
                            <SelectItem key={area.value} value={area.value}>
                              {area.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google_doc_url">URL do Google Docs</Label>
                      <Input
                        id="google_doc_url"
                        value={templateForm.google_doc_url}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, google_doc_url: e.target.value }))}
                        placeholder="https://docs.google.com/document/d/..."
                      />
                      <p className="text-xs text-gray-500">
                        Cole o link compartilhável do documento no Google Docs
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4">
                  {/* Add Variable Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Adicionar Nova Variável</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="var_name">Nome da Variável *</Label>
                          <Input
                            id="var_name"
                            value={variableForm.name}
                            onChange={(e) => setVariableForm(prev => ({ 
                              ...prev, 
                              name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                            }))}
                            placeholder="client_name"
                          />
                          <p className="text-xs text-gray-500">
                            Use apenas letras, números e underscore
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="var_label">Rótulo *</Label>
                          <Input
                            id="var_label"
                            value={variableForm.label}
                            onChange={(e) => setVariableForm(prev => ({ ...prev, label: e.target.value }))}
                            placeholder="Nome do Cliente"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="var_type">Tipo</Label>
                          <Select
                            value={variableForm.type}
                            onValueChange={(value: any) => setVariableForm(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="textarea">Texto Longo</SelectItem>
                              <SelectItem value="date">Data</SelectItem>
                              <SelectItem value="currency">Moeda</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="select">Seleção</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="var_placeholder">Placeholder</Label>
                          <Input
                            id="var_placeholder"
                            value={variableForm.placeholder}
                            onChange={(e) => setVariableForm(prev => ({ ...prev, placeholder: e.target.value }))}
                            placeholder="Ex: João Silva"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="var_required"
                            checked={variableForm.required}
                            onCheckedChange={(checked) => setVariableForm(prev => ({ ...prev, required: checked }))}
                          />
                          <Label htmlFor="var_required">Obrigatório</Label>
                        </div>

                        <div className="flex items-end">
                          <Button onClick={addVariable} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Variables List */}
                  {templateForm.variables.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Variáveis Configuradas ({templateForm.variables.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {templateForm.variables.map((variable, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                    {'{' + variable.name + '}'}
                                  </code>
                                  <span className="font-medium">{variable.label}</span>
                                  {variable.required && (
                                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Tipo: {getVariableTypeLabel(variable.type)}
                                  {variable.placeholder && ` • Placeholder: "${variable.placeholder}"`}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeVariable(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-6 border-t">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={saveTemplate} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}