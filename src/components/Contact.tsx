
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
            Entre em Contato
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Agende sua consultoria gratuita e proteja seu negócio hoje mesmo
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="shadow-none border border-gray-200 rounded-sm">
            <CardContent className="p-7">
              <h3 className="text-xl font-semibold text-blue-900 mb-5">Como podemos ajudar?</h3>
              <form className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <Input placeholder="Seu nome completo" className="border-gray-300 rounded-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
                    <Input type="email" placeholder="seu@email.com" className="border-gray-300 rounded-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Telefone/WhatsApp *</label>
                    <Input placeholder="(15) 99999-9999" className="border-gray-300 rounded-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Empresa (opcional)</label>
                  <Input placeholder="Nome da sua empresa" className="border-gray-300 rounded-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Como podemos ajudar? *</label>
                  <Textarea 
                    placeholder="Descreva sua necessidade jurídica, dúvida ou como podemos ajudar sua empresa..."
                    rows={4}
                    className="border-gray-300 rounded-sm"
                  />
                </div>
                <Button className="w-full bg-blue-900 hover:bg-blue-950 text-white py-2.5 text-base font-medium rounded-sm mb-3">
                  Enviar Mensagem
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  🔒 Seus dados estão protegidos pela LGPD. Responderemos em até 24 horas.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Atendimento Imediato</h4>
              <p className="text-gray-700 mb-4">Fale conosco agora mesmo pelo WhatsApp</p>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
                💬 Chamar no WhatsApp
              </Button>
            </div>

            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">📞 Telefone</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      (15) 3384-4013
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
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">📧 E-mail</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      financeiro@davilareisadvogados.com.br
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-none border border-gray-200 rounded-sm">
              <CardContent className="p-7">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-900 mt-1" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">📍 Endereço</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      Av. Dr. Vinício Gagliardi, 675<br />
                      Centro, Cerquilho/SP<br />
                      CEP: 18520-091
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
