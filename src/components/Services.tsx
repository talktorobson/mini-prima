
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Scale, Phone, FileText } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Shield,
      emoji: "🛡️",
      title: "Consultoria Preventiva",
      description: "Auditoria completa dos seus processos trabalhistas, criação de políticas internas e treinamento de equipes para prevenir litígios.",
      cta: "Saiba mais →"
    },
    {
      icon: Scale,
      emoji: "⚖️",
      title: "Defesa Estratégica",
      description: "Representação especializada em processos trabalhistas com foco na proteção do patrimônio empresarial e pessoal.",
      cta: "Saiba mais →"
    },
    {
      icon: Phone,
      emoji: "📱",
      title: "Portal do Cliente 24/7",
      description: "Acompanhe seus processos online com total transparência. Acesso exclusivo ao andamento dos seus casos, documentos e comunicação direta.",
      cta: "Acessar Portal →"
    },
    {
      icon: FileText,
      emoji: "📋",
      title: "Compliance Trabalhista",
      description: "Implementação de sistemas de compliance para garantir conformidade com a legislação e reduzir riscos significativamente.",
      cta: "Saiba mais →"
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
            Nossa Metodologia de Blindagem Empresarial
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Estratégias preventivas e defensivas para proteger sua empresa e patrimônio pessoal
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-gray-200 rounded-sm shadow-none hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{service.emoji}</span>
                  <CardTitle className="text-xl text-blue-900">{service.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 leading-relaxed">{service.description}</p>
                <button className="text-blue-900 font-medium hover:text-blue-700 transition-colors">
                  {service.cta}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
