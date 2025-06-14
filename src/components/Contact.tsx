
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            Entre em Contato
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Agende uma consulta ou tire suas dúvidas. 
            Nossa equipe está pronta para ajudar você com suas questões jurídicas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">Solicite uma Consulta</h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <Input placeholder="Seu nome completo" className="border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <Input placeholder="(11) 99999-9999" className="border-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" className="border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área de Interesse</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
                  <Textarea 
                    placeholder="Descreva brevemente sua necessidade jurídica..." 
                    rows={4}
                    className="border-gray-300"
                  />
                </div>
                <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 text-lg font-semibold">
                  Enviar Solicitação
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Endereço</h4>
                    <p className="text-gray-600">
                      Av. Paulista, 1000 - Conj. 1201<br />
                      Bela Vista, São Paulo - SP<br />
                      CEP: 01310-100
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Telefones</h4>
                    <p className="text-gray-600">
                      (11) 3456-7890<br />
                      (11) 99999-0000
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">E-mail</h4>
                    <p className="text-gray-600">
                      contato@davilareisadvogados.com.br<br />
                      atendimento@davilareisadvogados.com.br
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Horário de Funcionamento</h4>
                    <p className="text-gray-600">
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
