import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Option 3 - Navy background with gold accent
 */
const MockHome3: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-white bg-navy-950">
      {/* Navigation */}
      <nav className="bg-navy-900 fixed top-0 w-full z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="font-bold text-lg text-[#8C7933]">D'Avila Reis Advogados</div>
          <div className="hidden md:flex space-x-6">
            <a href="#about" className="hover:text-[#8C7933]">Sobre</a>
            <a href="#services" className="hover:text-[#8C7933]">Serviços</a>
            <a href="#contact" className="hover:text-[#8C7933]">Contato</a>
          </div>
          <Button onClick={() => navigate('/login')} className="bg-[#8C7933] text-navy-900">
            Portal
          </Button>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero */}
        <section className="py-24 text-center bg-gradient-to-b from-navy-900 to-navy-950">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Proteção Jurídica de Classe Mundial</h1>
            <p className="text-xl mb-8 text-[#8C7933] font-semibold">Foco em Resultados</p>
            <Button onClick={() => navigate('/login')} className="bg-[#8C7933] text-navy-900 px-8 py-3">
              Acessar Portal
            </Button>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 bg-navy-900">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold text-[#8C7933]">Sobre nós</h2>
            <p className="max-w-2xl mx-auto text-gray-300">Atuação empresarial e trabalhista com mais de duas décadas de experiência.</p>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 bg-navy-950">
          <div className="container mx-auto text-center space-y-8">
            <h2 className="text-3xl font-semibold text-[#8C7933]">O que fazemos</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 border border-navy-800 rounded-lg">
                <h3 className="font-semibold mb-2">Consultoria Preventiva</h3>
                <p className="text-sm text-gray-300">Auditoria e políticas internas para evitar litígios.</p>
              </div>
              <div className="p-6 border border-navy-800 rounded-lg">
                <h3 className="font-semibold mb-2">Defesa Estratégica</h3>
                <p className="text-sm text-gray-300">Representação em processos trabalhistas e cíveis.</p>
              </div>
              <div className="p-6 border border-navy-800 rounded-lg">
                <h3 className="font-semibold mb-2">Compliance Trabalhista</h3>
                <p className="text-sm text-gray-300">Implementação de programas de conformidade.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16 bg-navy-900">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold text-[#8C7933]">Entre em contato</h2>
            <p className="max-w-xl mx-auto text-gray-300">Envie sua mensagem e retornaremos em breve.</p>
            <Button className="bg-[#8C7933] text-navy-900 px-6 py-3">Enviar Mensagem</Button>
          </div>
        </section>
      </main>

      <footer className="bg-navy-900 border-t border-navy-800 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} D'Avila Reis Advogados
      </footer>
    </div>
  );
};

export default MockHome3;
