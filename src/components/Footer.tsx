
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
              <Scale className="h-7 w-7 text-blue-50" />
              <h3 className="text-xl font-semibold">D'Avila Reis Advogados</h3>
            </div>
            <p className="text-blue-100 leading-relaxed mb-4 max-w-md text-sm">
              Seriedade, confidencialidade e precisão na prestação de serviços jurídicos desde 2003.
            </p>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-blue-100 text-xs font-bold cursor-default select-none">
                f
              </div>
              <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-blue-100 text-xs font-bold cursor-default select-none">
                in
              </div>
              <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-blue-100 text-xs font-bold cursor-default select-none">
                @
              </div>
            </div>
          </div>

          {/* Areas de Atuação */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-blue-100">Áreas</h4>
            <ul className="space-y-2 text-blue-100 text-xs">
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Empresarial</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Trabalhista</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Civil</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Tributário</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Imobiliário</a></li>
              <li><a href="#" className="hover:text-amber-500 transition-colors">Direito Penal</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-blue-100">Contato</h4>
            <div className="space-y-3 text-blue-100 text-xs">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-100 mt-0.5" />
                <div>
                  <p>Av. Paulista, 1000 - Conj. 1201</p>
                  <p>Bela Vista, São Paulo - SP</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-100" />
                <p>(11) 3456-7890</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-100" />
                <p>contato@davilareisadvogados.com.br</p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-blue-950 mt-8 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-100 text-xs">
              © 2024 D'Avila Reis Advogados. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4 mt-3 md:mt-0">
              <a href="#" className="text-blue-100 hover:text-amber-500 text-xs transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-blue-100 hover:text-amber-500 text-xs transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-blue-100 hover:text-amber-500 text-xs transition-colors">
                Código de Ética
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
