
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
            Contato
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Preencha o formulário para contato institucional ou agendamento de consulta jurídica.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="shadow-none border border-gray-200 rounded-sm">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold text-blue-900 mb-5">Solicitação</h3>
              <form className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                    <Input placeholder="Nome completo" className="border-gray-300 rounded-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                    <Input placeholder="(11) 99999-9999" className="border-gray-300 rounded-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
                  <Input type="email" placeholder="email@dominio.com" className="border-gray-300 rounded-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Área de Interesse</label>
                  <select className="w-full px-2 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-800">
                    <option>Selecione a área</option>
                    <option>Direito Empresarial</option>
                    <option>Direito Trabalhista</option>
                    <option>Direito Civil</option>
                    <option>Direito Tributário</option>
                    <option>Direito Imobiliário</option>
                    <option>Direito Penal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mensagem</label>
                  <Textarea 
                    placeholder="Descreva sua demanda brevemente"
                    rows={4}
                    className="border-gray-300 rounded-sm"
                  />
                </div>
                <Button className="w-full bg-blue-900 hover:bg-blue-950 text-white py-2.5 text-base font-medium rounded-sm">
                  Enviar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-5">
            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Endereço</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Av. Paulista, 1000 - Conj. 1201<br />
                      Bela Vista, São Paulo - SP<br />
                      CEP: 01310-100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Telefone</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      (11) 3456-7890<br />
                      (11) 99999-0000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">E-mail</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      contato@davilareisadvogados.com.br<br />
                      atendimento@davilareisadvogados.com.br
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Horário de Atendimento</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Segunda a Sexta: 8h às 18h<br />
                      Sábado: 9h às 13h<br />
                      Domingo: Fechado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
