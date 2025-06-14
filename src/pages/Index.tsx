
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Hero from '@/components/Hero';
import RiskSection from '@/components/RiskSection';
import Services from '@/components/Services';
import Team from '@/components/Team';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Navigation Header with Login Button */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-xl">
            Escritório Jurídico
          </div>
          <Button 
            onClick={() => navigate('/login')}
            variant="outline" 
            className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-navy-900"
          >
            Portal do Cliente
          </Button>
        </div>
      </header>

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
