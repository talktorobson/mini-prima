
import React from 'react';
import { Button } from '@/components/ui/button';
import { Scale, Phone, Mail } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center space-x-3">
            <Scale className="h-8 w-8 text-amber-400" />
            <h1 className="text-2xl font-bold">D'Avila Reis Advogados</h1>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-amber-400" />
              <span className="text-sm">(11) 3456-7890</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-amber-400" />
              <span className="text-sm">contato@davilareisadvogados.com.br</span>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Excelência em
            <span className="block text-amber-400">Advocacia</span>
          </h2>
          
          <p className="text-xl md:text-2xl mb-12 text-blue-100 leading-relaxed max-w-3xl mx-auto">
            Mais de 20 anos de experiência oferecendo soluções jurídicas personalizadas 
            com foco em resultados excepcionais para nossos clientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-semibold px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105"
            >
              Agende uma Consulta
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-semibold px-8 py-4 text-lg transition-all duration-300"
            >
              Conheça Nossos Serviços
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">20+</div>
              <div className="text-blue-200">Anos de Experiência</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">500+</div>
              <div className="text-blue-200">Casos Resolvidos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">98%</div>
              <div className="text-blue-200">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
