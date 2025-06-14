
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Team = () => {
  const team = [
    {
      name: "Dr. Ricardo D'Avila",
      position: "Sócio Fundador",
      specialty: "Direito Empresarial e Tributário",
      experience: "25 anos de atuação",
      description: "Reconhecido pela sólida experiência na estruturação e condução de demandas empresariais de alta complexidade.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dra. Marina Reis",
      position: "Sócia",
      specialty: "Direito Trabalhista e Civil",
      experience: "18 anos de atuação",
      description: "Atuação destacada em negociações coletivas e contencioso de relações de trabalho.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dr. Carlos Santos",
      position: "Advogado Sênior",
      specialty: "Direito Penal e Processual",
      experience: "15 anos de atuação",
      description: "Tradição em defesas estratégicas e acompanhamento de casos criminais relevantes.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dra. Ana Oliveira",
      position: "Advogada",
      specialty: "Direito Imobiliário",
      experience: "12 anos de atuação",
      description: "Soluções técnicas para litígios e operações imobiliárias complexas.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
            Equipe Técnica
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Advogados altamente capacitados, especialistas em suas áreas de prática, comprometidos com a melhor solução.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, index) => (
            <Card key={index} className="text-center border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-7">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-20 h-20 rounded-sm mx-auto mb-5 object-cover border border-gray-300"
                />
                <h3 className="text-lg font-medium text-blue-900 mb-1">{member.name}</h3>
                <p className="text-blue-800 font-semibold mb-1 text-sm">{member.position}</p>
                <p className="text-xs text-gray-600 mb-2">{member.specialty}</p>
                <p className="text-xs text-blue-900 font-normal mb-2">{member.experience}</p>
                <p className="text-xs text-gray-700 leading-relaxed">{member.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-base text-gray-700 mb-4">
            Consulte a equipe para entender como podemos auxiliá-lo juridicamente.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Team;
