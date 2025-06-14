
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Target, Users, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Integridade",
      description: "Atuação pautada por princípios éticos e transparência em todas as etapas."
    },
    {
      icon: Target,
      title: "Excelência",
      description: "Qualidade constante na prestação de serviços jurídicos."
    },
    {
      icon: Users,
      title: "Comprometimento",
      description: "Foco total nos interesses do cliente e respeito à legislação vigente."
    },
    {
      icon: Award,
      title: "Experiência",
      description: "Especialização comprovada com mais de vinte anos de prática advocatícia."
    }
  ];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-4">
            Sobre o Escritório
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Desde 2003, o D'Avila Reis Advogados desenvolve atuação jurídica criteriosa e técnica,
            direcionada para empresas e pessoas físicas em demandas complexas e relevantes. Nosso compromisso é 
            fornecer soluções jurídicas sólidas de maneira objetiva e responsável.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-14">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=1942&auto=format&fit=crop"
              alt="Escritório D'Avila Reis Advogados"
              className="w-full object-cover border border-gray-300 rounded-sm"
              style={{ boxShadow: "none" }}
            />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-blue-900 mb-4">
              Perfil Institucional
            </h3>
            <p className="text-gray-700 mb-5 leading-relaxed">
              A estrutura foi concebida para reunir tradição, rigor técnico e atualização constante.
              Nossos advogados são especialistas preparados para diferentes áreas do direito e
              buscam sempre a solução mais adequada para cada caso.
            </p>
            <p className="text-gray-700 mb-5 leading-relaxed">
              Trabalhamos para manter a confiança depositada e também o reconhecimento de São Paulo e região
              quanto à seriedade e discrição em todas as frentes de atuação.
            </p>
            <p className="text-gray-700 leading-relaxed">
              O escritório acredita na relação profissional pautada pela objetividade, prudência
              e respeito pelas necessidades do cliente.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((value, index) => (
            <Card key={index} className="text-center border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-7">
                <value.icon className="h-10 w-10 text-blue-900 mx-auto mb-3" />
                <h4 className="text-lg font-medium text-blue-900 mb-2">{value.title}</h4>
                <p className="text-gray-700 leading-relaxed text-sm">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
