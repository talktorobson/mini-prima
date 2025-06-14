
import React from 'react';
import { Button } from '@/components/ui/button';
import { Scale, Phone, Mail } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-[70vh] bg-blue-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 pt-12 flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <Scale className="h-7 w-7 text-amber-500" />
          <h1 className="text-xl font-semibold tracking-wide">
            D'Avila Reis Advogados
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-amber-500" />
            <span className="text-sm">(11) 3456-7890</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-amber-500" />
            <span className="text-sm">contato@davilareisadvogados.com.br</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
            Advocacia Empresarial e Individual<br />
            <span className="block text-amber-500 font-normal">Excelência, Segurança e Respeito</span>
          </h2>
          <p className="text-lg md:text-xl mb-10 text-gray-100 leading-relaxed">
            D'Avila Reis Advogados atua há mais de duas décadas na defesa de interesses com seriedade, 
            ética e atenção máxima ao detalhe. 
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              size="lg"
              className="bg-blue-800 hover:bg-blue-950 text-white font-medium px-8 py-3 rounded border-0 transition-colors duration-200"
            >
              Agendar Consulta
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border border-white text-white font-medium px-8 py-3 rounded transition-colors duration-200 hover:bg-blue-50 hover:text-blue-900"
            >
              Áreas de Atuação
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">20+</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Anos de Serviço</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">500+</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Casos Atendidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">98%</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Índice de Êxito</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
