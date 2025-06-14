
import React from 'react';
import Hero from '@/components/Hero';
import RiskSection from '@/components/RiskSection';
import Services from '@/components/Services';
import Team from '@/components/Team';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
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
