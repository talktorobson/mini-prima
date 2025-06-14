
import React from 'react';
import { Scale, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Scale className="h-8 w-8 text-amber-400" />
              <h3 className="text-2xl font-bold">D'Avila Reis Advogados</h3>
            </div>
            <p className="text-blue-200 leading-relaxed mb-6 max-w-md">
              Mais de 20 anos oferecendo excelência em serviços jurídicos, 
              com foco na satisfação do cliente e resultados excepcionais.
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors cursor-pointer">
                <span className="text-sm font-bold">f</span>
              </div>
              <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors cursor-pointer">
                <span className="text-sm font-bold">in</span>
              </div>
              <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center hover:bg-amber-500 transition-colors cursor-pointer">
                <span className="text-sm font-bold">@</span>
              </div>
            </div>
          </div>

          {/* Areas de Atuação */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-amber-400">Áreas de Atuação</h4>
            <ul className="space-y-3 text-blue-200">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Empresarial</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Trabalhista</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Civil</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Tributário</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Imobiliário</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Direito Penal</a></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-amber-400">Contato</h4>
            <div className="space-y-4 text-blue-200">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <p>Av. Paulista, 1000 - Conj. 1201</p>
                  <p>Bela Vista, São Paulo - SP</p>
                  <p>CEP: 01310-100</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-amber-400" />
                <p>(11) 3456-7890</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-amber-400" />
                <p>contato@davilareisadvogados.com.br</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-200 text-sm">
              © 2024 D'Avila Reis Advogados. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-200 hover:text-amber-400 text-sm transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-blue-200 hover:text-amber-400 text-sm transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-blue-200 hover:text-amber-400 text-sm transition-colors">
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
