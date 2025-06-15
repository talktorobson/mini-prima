
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Phone, Shield } from 'lucide-react';
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
          Portal do Cliente
        </Button>
      </div>

      {/* Admin Access Button */}
      <div className="fixed top-6 right-48 z-50">
        <Button 
          onClick={() => navigate('/admin/login')}
          variant="outline"
          className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border-red-500/30 hover:border-red-400 font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
        >
          <Shield className="h-4 w-4" />
          Admin
        </Button>
      </div>

      {/* Quick Contact Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
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
