import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Option 2 - Dark layout with gold accent
 */
const MockHome2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-white bg-[#32373c]">
      {/* Navigation */}
      <nav className="bg-[#32373c] fixed top-0 w-full z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="font-bold text-lg text-[#8C7933]">D'Avila Reis Advogados</div>
          <div className="hidden md:flex space-x-6">
            <a href="#about" className="hover:text-[#8C7933]">Sobre</a>
            <a href="#services" className="hover:text-[#8C7933]">Serviços</a>
            <a href="#contact" className="hover:text-[#8C7933]">Contato</a>
          </div>
          <Button onClick={() => navigate('/login')} className="bg-[#8C7933] text-white">
            Portal
          </Button>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero */}
        <section className="py-24 text-center bg-[#1f2224]">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Excelência em Direito Empresarial</h1>
            <p className="text-xl mb-8 text-[#8C7933] font-semibold">Solidez e Confiança</p>
            <Button onClick={() => navigate('/login')} className="bg-[#8C7933] text-white px-8 py-3">
              Acessar Portal
            </Button>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold text-[#8C7933]">Sobre o Escritório</h2>
            <p className="max-w-2xl mx-auto text-gray-300">Histórico de sucesso em causas empresariais e trabalhistas, com atendimento personalizado.</p>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 bg-[#2b2e30]">
          <div className="container mx-auto text-center space-y-8">
            <h2 className="text-3xl font-semibold text-[#8C7933]">Serviços</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 border border-[#444] rounded-lg">
                <h3 className="font-semibold mb-2">Consultoria Preventiva</h3>
                <p className="text-sm text-gray-300">Auditoria e políticas internas para evitar litígios.</p>
              </div>
              <div className="p-6 border border-[#444] rounded-lg">
                <h3 className="font-semibold mb-2">Defesa Estratégica</h3>
                <p className="text-sm text-gray-300">Representação em processos trabalhistas e cíveis.</p>
              </div>
              <div className="p-6 border border-[#444] rounded-lg">
                <h3 className="font-semibold mb-2">Compliance Trabalhista</h3>
                <p className="text-sm text-gray-300">Implementação de programas de conformidade.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold text-[#8C7933]">Contato</h2>
            <p className="max-w-xl mx-auto text-gray-300">Fale conosco e retornaremos rapidamente.</p>
            <Button className="bg-[#8C7933] text-white px-6 py-3">Enviar Mensagem</Button>
          </div>
        </section>
      </main>

      <footer className="bg-[#1f2224] border-t border-[#444] py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} D'Avila Reis Advogados
      </footer>
    </div>
  );
};

export default MockHome2;
