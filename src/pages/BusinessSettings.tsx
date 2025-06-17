import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Upload, 
  Save, 
  Building, 
  Palette, 
  FileText, 
  Cloud,
  Check,
  X,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { businessSettingsService, BusinessSettingsWithFiles } from '@/services/businessSettingsService';
import { googleDocsService } from '@/services/googleDocsService';

export default function BusinessSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettingsWithFiles | null>(null);
  const [googleSettings, setGoogleSettings] = useState({
    enabled: false,
    client_id: '',
    drive_folder_id: '',
    has_credentials: false,
  });

  // Form states
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    oab_registration: '',
    cnpj: '',
  });

  const [pdfForm, setPdfForm] = useState({
    pdf_header_color: '#dc2626',
    pdf_footer_text: '',
    pdf_watermark_text: '',
    pdf_font_family: 'Arial',
  });

  const [googleForm, setGoogleForm] = useState({
    google_docs_enabled: false,
    google_client_id: '',
    google_client_secret: '',
    google_drive_folder_id: '',
  });

  // File upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [letterheadFile, setLetterheadFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [businessSettings, googleDocsSettings] = await Promise.all([
        businessSettingsService.getBusinessSettings(),
        businessSettingsService.getGoogleDocsSettings(),
      ]);

      if (businessSettings) {
        setSettings(businessSettings);
        setCompanyForm({
          company_name: businessSettings.company_name || '',
          company_address: businessSettings.company_address || '',
          company_phone: businessSettings.company_phone || '',
          company_email: businessSettings.company_email || '',
          company_website: businessSettings.company_website || '',
          oab_registration: businessSettings.oab_registration || '',
          cnpj: businessSettings.cnpj || '',
        });
        setPdfForm({
          pdf_header_color: businessSettings.pdf_header_color || '#dc2626',
          pdf_footer_text: businessSettings.pdf_footer_text || '',
          pdf_watermark_text: businessSettings.pdf_watermark_text || '',
          pdf_font_family: businessSettings.pdf_font_family || 'Arial',
        });
        setGoogleForm({
          google_docs_enabled: businessSettings.google_docs_enabled || false,
          google_client_id: businessSettings.google_client_id || '',
          google_client_secret: businessSettings.google_client_secret || '',
          google_drive_folder_id: businessSettings.google_drive_folder_id || '',
        });
      }

      setGoogleSettings(googleDocsSettings);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'letterhead' | 'favicon') => {
    const validation = businessSettingsService.validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: 'Erro',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(type);
      await businessSettingsService.uploadBusinessFile(file, type);
      
      toast({
        title: 'Sucesso',
        description: `${type === 'logo' ? 'Logo' : type === 'letterhead' ? 'Papel timbrado' : 'Favicon'} enviado com sucesso`,
      });
      
      await loadSettings(); // Refresh to show new file
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar arquivo',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const saveCompanySettings = async () => {
    try {
      setSaving(true);
      await businessSettingsService.updateBusinessSettings(companyForm);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações da empresa salvas com sucesso',
      });
      
      await loadSettings();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações da empresa',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const savePdfSettings = async () => {
    try {
      setSaving(true);
      await businessSettingsService.updateBusinessSettings(pdfForm);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações de PDF salvas com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações de PDF',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveGoogleSettings = async () => {
    try {
      setSaving(true);
      await businessSettingsService.updateGoogleDocsSettings(googleForm);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações do Google Docs salvas com sucesso',
      });
      
      await loadSettings();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações do Google Docs',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const connectGoogleDocs = async () => {
    try {
      const authUrl = await googleDocsService.getGoogleAuthUrl();
      window.open(authUrl, 'google-auth', 'width=600,height=600');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com Google Docs',
        variant: 'destructive',
      });
    }
  };

  const FileUploadCard = ({ 
    title, 
    description, 
    type, 
    currentFile, 
    onFileSelect 
  }: {
    title: string;
    description: string;
    type: 'logo' | 'letterhead' | 'favicon';
    currentFile?: any;
    onFileSelect: (file: File) => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentFile && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Check className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{currentFile.file_name}</p>
              <p className="text-xs text-green-600">
                {businessSettingsService.formatFileSize(currentFile.file_size)} • Enviado em {new Date(currentFile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(currentFile.file_url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            className="text-xs"
          />
          <Button
            size="sm"
            disabled={uploading === type}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) onFileSelect(file);
              };
              input.click();
            }}
          >
            {uploading === type ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          Formatos aceitos: JPG, PNG, GIF, SVG • Máximo 5MB
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
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
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações Empresariais</h1>
        </div>
        <Badge variant="secondary">Sistema de PDF e Documentos</Badge>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Identidade Visual
          </TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF e Documentos
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Google Docs
          </TabsTrigger>
        </TabsList>

        {/* Company Information */}
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações básicas da empresa que serão usadas em documentos e PDFs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="D'Avila Reis Advogados"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oab_registration">Registro OAB</Label>
                  <Input
                    id="oab_registration"
                    value={companyForm.oab_registration}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, oab_registration: e.target.value }))}
                    placeholder="OAB/SP 999.999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_email">E-mail</Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={companyForm.company_email}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, company_email: e.target.value }))}
                    placeholder="contato@davilareis.adv.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">Telefone</Label>
                  <Input
                    id="company_phone"
                    value={companyForm.company_phone}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, company_phone: e.target.value }))}
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_website">Website</Label>
                  <Input
                    id="company_website"
                    value={companyForm.company_website}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, company_website: e.target.value }))}
                    placeholder="https://davilareis.adv.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_address">Endereço</Label>
                <Textarea
                  id="company_address"
                  value={companyForm.company_address}
                  onChange={(e) => setCompanyForm(prev => ({ ...prev, company_address: e.target.value }))}
                  placeholder="Rua exemplo, 123 - Bairro - São Paulo, SP - CEP 00000-000"
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveCompanySettings} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Informações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Identity */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FileUploadCard
              title="Logo da Empresa"
              description="Logo principal usado em documentos e interface"
              type="logo"
              currentFile={settings?.logo_file}
              onFileSelect={(file) => handleFileUpload(file, 'logo')}
            />

            <FileUploadCard
              title="Papel Timbrado"
              description="Template para papel timbrado de documentos"
              type="letterhead"
              currentFile={settings?.letterhead_file}
              onFileSelect={(file) => handleFileUpload(file, 'letterhead')}
            />

            <FileUploadCard
              title="Favicon"
              description="Ícone do sistema (16x16 ou 32x32 pixels)"
              type="favicon"
              currentFile={settings?.favicon_file}
              onFileSelect={(file) => handleFileUpload(file, 'favicon')}
            />
          </div>
        </TabsContent>

        {/* PDF Settings */}
        <TabsContent value="pdf" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de PDF</CardTitle>
              <CardDescription>
                Personalize a aparência e formatação dos PDFs gerados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pdf_header_color">Cor do Cabeçalho</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pdf_header_color"
                      type="color"
                      value={pdfForm.pdf_header_color}
                      onChange={(e) => setPdfForm(prev => ({ ...prev, pdf_header_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={pdfForm.pdf_header_color}
                      onChange={(e) => setPdfForm(prev => ({ ...prev, pdf_header_color: e.target.value }))}
                      placeholder="#dc2626"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdf_font_family">Fonte dos Documentos</Label>
                  <select
                    id="pdf_font_family"
                    value={pdfForm.pdf_font_family}
                    onChange={(e) => setPdfForm(prev => ({ ...prev, pdf_font_family: e.target.value }))}
                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf_footer_text">Texto do Rodapé</Label>
                <Input
                  id="pdf_footer_text"
                  value={pdfForm.pdf_footer_text}
                  onChange={(e) => setPdfForm(prev => ({ ...prev, pdf_footer_text: e.target.value }))}
                  placeholder="Documento gerado automaticamente pelo sistema"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdf_watermark_text">Marca d'água (opcional)</Label>
                <Input
                  id="pdf_watermark_text"
                  value={pdfForm.pdf_watermark_text}
                  onChange={(e) => setPdfForm(prev => ({ ...prev, pdf_watermark_text: e.target.value }))}
                  placeholder="CONFIDENCIAL"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={savePdfSettings} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Docs Integration */}
        <TabsContent value="google" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Integração Google Docs
                {googleSettings.enabled && googleSettings.has_credentials && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure a integração com Google Docs para templates de documentos editáveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="google_docs_enabled"
                  checked={googleForm.google_docs_enabled}
                  onCheckedChange={(checked) => setGoogleForm(prev => ({ ...prev, google_docs_enabled: checked }))}
                />
                <Label htmlFor="google_docs_enabled">Ativar integração Google Docs</Label>
              </div>

              {googleForm.google_docs_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="google_client_id">Google Client ID</Label>
                      <Input
                        id="google_client_id"
                        value={googleForm.google_client_id}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, google_client_id: e.target.value }))}
                        placeholder="xxxxxxxx.apps.googleusercontent.com"
                        type="password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google_client_secret">Google Client Secret</Label>
                      <Input
                        id="google_client_secret"
                        value={googleForm.google_client_secret}
                        onChange={(e) => setGoogleForm(prev => ({ ...prev, google_client_secret: e.target.value }))}
                        placeholder="GOCSPX-xxxxxxxxxxxxxxxxxx"
                        type="password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_drive_folder_id">ID da Pasta do Google Drive (opcional)</Label>
                    <Input
                      id="google_drive_folder_id"
                      value={googleForm.google_drive_folder_id}
                      onChange={(e) => setGoogleForm(prev => ({ ...prev, google_drive_folder_id: e.target.value }))}
                      placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                    />
                    <p className="text-xs text-gray-500">
                      Pasta onde os documentos gerados serão salvos no Google Drive
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Como configurar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                      <li>Crie ou selecione um projeto</li>
                      <li>Habilite as APIs: Google Docs API e Google Drive API</li>
                      <li>Crie credenciais OAuth 2.0</li>
                      <li>Adicione a URL de callback: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/admin/google-auth-callback</code></li>
                      <li>Copie o Client ID e Client Secret para os campos acima</li>
                    </ol>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={saveGoogleSettings} disabled={saving}>
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar Configurações
                    </Button>

                    {googleSettings.has_credentials && (
                      <Button variant="outline" onClick={connectGoogleDocs}>
                        <Cloud className="h-4 w-4 mr-2" />
                        Conectar Google Docs
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}