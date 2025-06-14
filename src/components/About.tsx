
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Target, Users, Award } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Integridade",
      description: "Atuamos com ética e transparência em todos os nossos processos e relacionamentos."
    },
    {
      icon: Target,
      title: "Excelência",
      description: "Buscamos constantemente a perfeição em nossos serviços e resultados."
    },
    {
      icon: Users,
      title: "Compromisso",
      description: "Dedicação total aos interesses e objetivos de nossos clientes."
    },
    {
      icon: Award,
      title: "Experiência",
      description: "Mais de duas décadas de expertise em diversas áreas do direito."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            Sobre D'Avila Reis Advogados
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Fundado com o compromisso de oferecer serviços jurídicos de excelência, 
            nosso escritório se destaca pela abordagem personalizada e resultados consistentes 
            em todas as áreas de atuação.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1433832597046-4f10e10ac764?q=80&w=1942&auto=format&fit=crop" 
              alt="Escritório D'Avila Reis Advogados"
              className="rounded-lg shadow-2xl"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold text-blue-900 mb-6">
              Nossa História
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Com início em 2003, o escritório D'Avila Reis Advogados nasceu da visão de 
              criar um ambiente jurídico que combinasse tradição e inovação, oferecendo 
              soluções eficazes para empresas e pessoas físicas.
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Nossa equipe multidisciplinar atua em diversas áreas do direito, sempre 
              com foco na satisfação do cliente e na obtenção dos melhores resultados 
              possíveis para cada caso.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Hoje, somos reconhecidos como um dos principais escritórios de advocacia 
              de São Paulo, mantendo nossa essência de proximidade e dedicação exclusiva 
              a cada cliente que nos confia seus interesses.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-8">
                <value.icon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-blue-900 mb-3">{value.title}</h4>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
