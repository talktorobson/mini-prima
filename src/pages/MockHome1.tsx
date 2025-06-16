import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * Option 1 - Light layout using colors from davilareisadvogados.com.br
 * Accent color #8C7933 and dark gray text
 */
const MockHome1: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="font-sans text-[#32373c] bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow fixed top-0 w-full z-10">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="font-bold text-lg">D'Avila Reis Advogados</div>
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
        <section className="bg-gray-100 py-24 text-center">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Protegemos Seu Negócio</h1>
            <p className="text-xl mb-8 text-[#8C7933] font-semibold">Blindamos Seu Patrimônio</p>
            <Button onClick={() => navigate('/login')} className="bg-[#8C7933] text-white px-8 py-3">
              Acessar Portal
            </Button>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold">Quem Somos</h2>
            <p className="max-w-2xl mx-auto">Mais de 20 anos de experiência em direito empresarial e trabalhista. Transparência e atendimento personalizado para cada cliente.</p>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-16 bg-gray-50">
          <div className="container mx-auto text-center space-y-8">
            <h2 className="text-3xl font-semibold">Serviços</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">Consultoria Preventiva</h3>
                <p className="text-sm">Auditoria e políticas internas para evitar litígios.</p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">Defesa Estratégica</h3>
                <p className="text-sm">Representação em processos trabalhistas e cíveis.</p>
              </div>
              <div className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">Compliance Trabalhista</h3>
                <p className="text-sm">Implementação de programas de conformidade.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16">
          <div className="container mx-auto text-center space-y-4">
            <h2 className="text-3xl font-semibold">Fale Conosco</h2>
            <p className="max-w-xl mx-auto">Entre em contato e retornaremos em breve.</p>
            <Button className="bg-[#8C7933] text-white px-6 py-3">Enviar Mensagem</Button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-6 text-center text-sm">
        © {new Date().getFullYear()} D'Avila Reis Advogados
      </footer>
    </div>
  );
};

export default MockHome1;
