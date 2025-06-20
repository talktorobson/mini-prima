
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Phone } from 'lucide-react';
import Hero from '@/components/Hero';
import RiskSection from '@/components/RiskSection';
import Services from '@/components/Services';
import Team from '@/components/Team';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Floating Portal Access Button */}
      <div className="fixed top-6 right-6 z-50">
        <Button 
          onClick={() => navigate('/login')}
          className="bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold px-6 py-3 rounded-full shadow-2xl border-2 border-white/20 backdrop-blur-sm flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
        >
          <Users className="h-5 w-5" />
          Fazer Login
        </Button>
      </div>

      {/* Quick Contact Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          onClick={() => {
            const phoneNumber = "5511999999999"; // Replace with actual business WhatsApp number
            const message = "Olá! Gostaria de saber mais sobre os serviços da D'Avila Reis Advogados.";
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }}
        >
          <Phone className="h-5 w-5" />
          WhatsApp
        </Button>
      </div>

      <Hero />
      <RiskSection />
      <Services />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
