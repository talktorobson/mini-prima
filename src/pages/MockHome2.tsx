import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MockHome2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-white bg-[#111]">
      {/* Navigation */}
      <nav className="bg-[#111] fixed top-0 w-full z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="font-bold text-lg">D'Avila Reis Advogados</div>
          <div className="hidden md:flex space-x-8">
            <a href="#about" className="hover:text-[#760000]">Sobre</a>
            <a href="#services" className="hover:text-[#760000]">Áreas de Atuação</a>
            <a href="#team" className="hover:text-[#760000]">Profissionais</a>
            <a href="#contact" className="hover:text-[#760000]">Contato</a>
          </div>
          <Button onClick={() => navigate('/login')} className="bg-[#760000] text-white">
            Portal
          </Button>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero */}
        <section className="bg-[#111] py-20">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Proteção Jurídica de Classe Mundial</h1>
            <p className="text-lg md:text-xl mb-8">Assessoria empresarial e trabalhista focada em resultados.</p>
            <Button onClick={() => navigate('/login')} className="bg-[#760000] text-white px-8 py-3">
              Acessar Portal
            </Button>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 bg-[#111]">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold">Sobre o Escritório</h2>
            <p className="max-w-3xl mx-auto text-gray-300">Mais de 20 anos de experiência em direito empresarial e trabalhista preventivo.</p>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 bg-[#111]">
          <div className="container mx-auto text-center space-y-8">
            <h2 className="text-3xl font-semibold">Áreas de Atuação</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Consultoria Preventiva</h3>
                <p className="text-sm text-gray-300">Auditoria e políticas internas para evitar litígios.</p>
              </div>
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Defesa Estratégica</h3>
                <p className="text-sm text-gray-300">Representação em processos trabalhistas e cíveis.</p>
              </div>
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="font-semibold mb-2">Compliance Trabalhista</h3>
                <p className="text-sm text-gray-300">Implementação de programas de conformidade.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section id="team" className="py-16 bg-[#111]">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold">Nossa Equipe</h2>
            <p className="max-w-3xl mx-auto text-gray-300">Profissionais especializados e comprometidos com o sucesso dos clientes.</p>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16 bg-[#111]">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold">Fale Conosco</h2>
            <p className="max-w-3xl mx-auto text-gray-300">Envie uma mensagem e retornaremos em breve.</p>
            <Button className="bg-amber-500 text-navy-900 px-6 py-3">Enviar Mensagem</Button>
          </div>
        </section>
      </main>

      <footer className="bg-[#111] border-t border-[#333] py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} D'Avila Reis Advogados
      </footer>
    </div>
  );
};

export default MockHome2;
