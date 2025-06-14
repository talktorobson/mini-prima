
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Scale, Users, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Services = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Shield,
      title: "Consultoria Preventiva",
      description: "Auditoria completa dos seus processos trabalhistas, criação de políticas internas e treinamento de equipes para prevenir litígios.",
      highlight: false
    },
    {
      icon: Scale,
      title: "Defesa Estratégica",
      description: "Representação especializada em processos trabalhistas com foco na proteção do patrimônio empresarial e pessoal.",
      highlight: false
    },
    {
      icon: Users,
      title: "Portal do Cliente 24/7",
      description: "Acompanhe seus processos online com total transparência. Acesso exclusivo ao andamento dos seus casos, documentos e comunicação direta.",
      highlight: true
    },
    {
      icon: FileText,
      title: "Compliance Trabalhista",
      description: "Implementação de sistemas de compliance para garantir conformidade com a legislação e reduzir riscos significativamente.",
      highlight: false
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 to-blue-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nossa Metodologia de Blindagem Empresarial
          </h2>
          <p className="text-xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
            Estratégias preventivas e defensivas para proteger sua empresa e patrimônio pessoal
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden ${
                service.highlight 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-blue-900' 
                  : 'bg-blue-800/50 backdrop-blur-sm border border-blue-600/20'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                    service.highlight ? 'bg-blue-900/20' : 'bg-amber-500/20'
                  }`}>
                    <service.icon className={`h-6 w-6 ${
                      service.highlight ? 'text-blue-900' : 'text-amber-400'
                    }`} />
                  </div>
                  <CardTitle className={`text-2xl ${
                    service.highlight ? 'text-blue-900' : 'text-white'
                  }`}>
                    {service.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className={`mb-6 leading-relaxed text-lg ${
                  service.highlight ? 'text-blue-800' : 'text-blue-100'
                }`}>
                  {service.description}
                </p>
                
                {service.highlight ? (
                  <Button
                    onClick={() => navigate('/login')}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 w-full justify-center"
                  >
                    Acessar Portal
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <button className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-2">
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
