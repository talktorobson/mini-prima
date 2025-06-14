
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
            <span className="text-sm">(15) 3384-4013</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-amber-500" />
            <span className="text-sm">financeiro@davilareisadvogados.com.br</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
            Protegemos Seu Negócio.<br />
            <span className="block text-amber-500 font-normal">Blindamos Seu Patrimônio.</span>
          </h2>
          <p className="text-lg md:text-xl mb-10 text-gray-100 leading-relaxed">
            Transformando desafios jurídicos em oportunidades desde 2004. 20 anos especializados em direito 
            empresarial e trabalhista preventivo. Defendemos empresários contra processos que podem atingir 
            seu patrimônio pessoal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Button 
              size="lg"
              className="bg-blue-800 hover:bg-blue-950 text-white font-medium px-8 py-3 rounded border-0 transition-colors duration-200"
            >
              Consultoria Gratuita →
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border border-white text-white font-medium px-8 py-3 rounded transition-colors duration-200 hover:bg-blue-50 hover:text-blue-900"
            >
              Acessar Portal do Cliente
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">2.500+</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Processos Gerenciados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">200+</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Clientes Protegidos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">20</div>
              <div className="text-gray-200 text-sm uppercase tracking-wide">Anos no Mercado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
