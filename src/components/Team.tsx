
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Team = () => {
  const team = [
    {
      name: "Dr. Ricardo D'Avila",
      position: "Sócio Fundador",
      specialty: "Direito Empresarial e Tributário",
      experience: "25 anos de experiência",
      description: "Especialista em direito empresarial com vasta experiência em fusões e aquisições.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dra. Marina Reis",
      position: "Sócia",
      specialty: "Direito Trabalhista e Civil",
      experience: "18 anos de experiência",
      description: "Reconhecida expertise em direito trabalhista e relações de trabalho complexas.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dr. Carlos Santos",
      position: "Advogado Sênior",
      specialty: "Direito Penal e Processual",
      experience: "15 anos de experiência",
      description: "Especialista em defesa criminal com histórico de casos de grande repercussão.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
    },
    {
      name: "Dra. Ana Oliveira",
      position: "Advogada",
      specialty: "Direito Imobiliário",
      experience: "12 anos de experiência",
      description: "Foco em transações imobiliárias complexas e direito condominial.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            Nossa Equipe
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Profissionais altamente qualificados e experientes, 
            dedicados a oferecer as melhores soluções jurídicas para nossos clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-6 object-cover border-4 border-amber-400"
                />
                <h3 className="text-xl font-bold text-blue-900 mb-2">{member.name}</h3>
                <p className="text-amber-600 font-semibold mb-2">{member.position}</p>
                <p className="text-sm text-gray-600 mb-3">{member.specialty}</p>
                <p className="text-sm text-blue-700 font-medium mb-4">{member.experience}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-8">
            Nossa equipe está sempre em crescimento. Conheça todos os nossos profissionais.
          </p>
          <button className="bg-amber-500 hover:bg-amber-600 text-blue-900 px-8 py-4 rounded-lg font-semibold transition-colors duration-300">
            Ver Equipe Completa
          </button>
        </div>
      </div>
    </section>
  );
};

export default Team;
