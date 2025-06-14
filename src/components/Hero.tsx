
import React from 'react';
import { Button } from '@/components/ui/button';
import { Scale, Phone, Mail, ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      {/* Header */}
      <header className="container mx-auto px-6 pt-8 flex justify-between items-center mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <Scale className="h-6 w-6 text-blue-900" />
          </div>
          <h1 className="text-2xl font-bold tracking-wide">
            D'Avila Reis Advogados
          </h1>
        </div>
        
        {/* Desktop Contact Info */}
        <div className="hidden lg:flex items-center space-x-8">
          <div className="flex items-center space-x-2 text-blue-100">
            <Phone className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium">(15) 3384-4013</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-100">
            <Mail className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium">financeiro@davilareisadvogados.com.br</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto px-6 py-16 flex items-center min-h-[80vh]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Protegemos Seu Negócio.
          </h2>
          <h3 className="text-3xl md:text-4xl font-semibold mb-8 text-amber-400">
            Blindamos Seu Patrimônio.
          </h3>
          
          <p className="text-xl md:text-2xl mb-12 text-blue-100 leading-relaxed max-w-3xl mx-auto">
            20 anos especializados em direito empresarial e trabalhista preventivo. 
            Defendemos empresários contra processos que podem atingir seu patrimônio pessoal.
          </p>
          
          {/* CTA Buttons - Portal Access Prominent */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button 
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-blue-900 font-bold px-10 py-4 text-lg rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Users className="h-5 w-5" />
              Acessar Portal do Cliente
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white font-semibold px-10 py-4 text-lg rounded-lg hover:bg-white hover:text-blue-900 transition-all duration-200"
            >
              Consultoria Gratuita
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">2.500+</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide font-medium">Processos Gerenciados</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">200+</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide font-medium">Clientes Protegidos</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-amber-400 mb-2">20</div>
              <div className="text-blue-100 text-sm uppercase tracking-wide font-medium">Anos no Mercado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
