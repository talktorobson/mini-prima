
import React from 'react';
import { Scale, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-10 border-t border-blue-950">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">DR</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">D'avila Reis</h3>
                <p className="text-sm text-blue-100">Advogados</p>
              </div>
            </div>
            <p className="text-blue-100 leading-relaxed mb-4 max-w-md text-sm">
              Protegendo empresários há mais de 20 anos através de estratégias jurídicas preventivas e defesa especializada.
            </p>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-blue-100">Serviços</h4>
            <ul className="space-y-2 text-blue-100 text-xs">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Consultoria Preventiva</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Defesa Trabalhista</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Compliance Empresarial</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Portal do Cliente</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-blue-100">Recursos</h4>
            <ul className="space-y-2 text-blue-100 text-xs">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Blog Jurídico</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Casos de Sucesso</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Guias Gratuitos</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Trabalhe Conosco</a></li>
            </ul>
          </div>
        </div>

        {/* Contato Footer */}
        <div className="border-t border-blue-950 mt-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-100" />
              <p className="text-blue-100 text-xs">Telefone: (15) 3384-4013</p>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-100" />
              <p className="text-blue-100 text-xs">Email: financeiro@davilareisadvogados.com.br</p>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-100" />
              <p className="text-blue-100 text-xs">Av. Dr. Vinício Gagliardi, 675, Centro, Cerquilho/SP</p>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-950 pt-4">
          <p className="text-blue-100 text-xs text-center">
            © 2024 D'avila Reis Advogados. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
