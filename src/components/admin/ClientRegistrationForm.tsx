
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { clientRegistrationService, ClientRegistrationData } from '@/services/clientRegistration';
import { useToast } from '@/hooks/use-toast';

const ClientRegistrationForm = () => {
  const [formData, setFormData] = useState<ClientRegistrationData>({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    cnpj: '',
    address: '',
    position: '',
    industry: '',
    company_size: '',
    marketing_consent: false,
    data_processing_consent: true,
    preferred_contact_method: 'email',
    reference_source: '',
    estimated_case_value: undefined,
    urgency_level: 'normal',
    registration_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof ClientRegistrationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.data_processing_consent) {
      toast({
        title: "Erro",
        description: "É necessário consentir com o processamento de dados para continuar",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await clientRegistrationService.submitRegistration(formData);
      
      setSubmitted(true);
      toast({
        title: "Sucesso",
        description: "Cadastro enviado com sucesso! Entraremos em contato em breve."
      });
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar cadastro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro Enviado com Sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Recebemos seu cadastro e nossa equipe entrará em contato em breve para dar continuidade ao processo.
            </p>
            <Button onClick={() => {
              setSubmitted(false);
              setFormData({
                company_name: '',
                contact_person: '',
                email: '',
                phone: '',
                cnpj: '',
                address: '',
                position: '',
                industry: '',
                company_size: '',
                marketing_consent: false,
                data_processing_consent: true,
                preferred_contact_method: 'email',
                reference_source: '',
                estimated_case_value: undefined,
                urgency_level: 'normal',
                registration_notes: ''
              });
            }}>
              Fazer Novo Cadastro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastro de Cliente
        </CardTitle>
        <CardDescription>
          Preencha os dados abaixo para iniciar o processo de cadastramento como cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Pessoa de Contato *</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Setor/Indústria</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="Ex: Tecnologia, Varejo, Saúde"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_size">Porte da Empresa</Label>
              <Select 
                value={formData.company_size} 
                onValueChange={(value) => handleInputChange('company_size', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o porte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="micro">Microempresa (até 9 funcionários)</SelectItem>
                  <SelectItem value="pequena">Pequena (10-49 funcionários)</SelectItem>
                  <SelectItem value="media">Média (50-249 funcionários)</SelectItem>
                  <SelectItem value="grande">Grande (250+ funcionários)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_case_value">Valor Estimado do Caso (R$)</Label>
              <Input
                id="estimated_case_value"
                type="number"
                value={formData.estimated_case_value || ''}
                onChange={(e) => handleInputChange('estimated_case_value', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency_level">Nível de Urgência</Label>
              <Select 
                value={formData.urgency_level} 
                onValueChange={(value) => handleInputChange('urgency_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_contact_method">Método de Contato Preferido</Label>
              <Select 
                value={formData.preferred_contact_method} 
                onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_source">Como nos conheceu?</Label>
              <Input
                id="reference_source"
                value={formData.reference_source}
                onChange={(e) => handleInputChange('reference_source', e.target.value)}
                placeholder="Ex: Google, indicação, redes sociais"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="registration_notes">Informações Adicionais</Label>
            <Textarea
              id="registration_notes"
              value={formData.registration_notes}
              onChange={(e) => handleInputChange('registration_notes', e.target.value)}
              rows={4}
              placeholder="Descreva brevemente sua necessidade jurídica ou qualquer informação relevante"
            />
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="data_processing_consent"
                checked={formData.data_processing_consent}
                onCheckedChange={(checked) => handleInputChange('data_processing_consent', checked)}
              />
              <Label htmlFor="data_processing_consent" className="text-sm">
                Concordo com o processamento dos meus dados pessoais conforme a LGPD *
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing_consent"
                checked={formData.marketing_consent}
                onCheckedChange={(checked) => handleInputChange('marketing_consent', checked)}
              />
              <Label htmlFor="marketing_consent" className="text-sm">
                Aceito receber comunicações de marketing por email e WhatsApp
              </Label>
            </div>
          </div>

          {!formData.data_processing_consent && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                É necessário consentir com o processamento de dados para prosseguir com o cadastro.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={loading || !formData.data_processing_consent}
            className="w-full"
          >
            {loading ? 'Enviando...' : 'Enviar Cadastro'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientRegistrationForm;
