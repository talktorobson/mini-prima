
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, FileText, Briefcase, Home, Gavel } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Building,
      title: "Direito Empresarial",
      description: "Consultoria abrangente a empresas, contratos, fusões, aquisições e compliance corporativo.",
      features: [
        "Constituição de empresas",
        "Contratos comerciais",
        "Fusões e aquisições",
        "Compliance"
      ]
    },
    {
      icon: Users,
      title: "Direito Trabalhista",
      description: "Atuação em conflitos laborais, processos, negociações coletivas e auditorias.",
      features: [
        "Consultoria preventiva",
        "Processos trabalhistas",
        "Negociações coletivas",
        "Auditorias trabalhistas"
      ]
    },
    {
      icon: FileText,
      title: "Direito Civil",
      description: "Abrangência em contratos, responsabilidade civil e obrigações patrimoniais.",
      features: [
        "Contratos diversos",
        "Responsabilidade civil",
        "Direito das obrigações",
        "Questões patrimoniais"
      ]
    },
    {
      icon: Briefcase,
      title: "Direito Tributário",
      description: "Planejamento tributário e defesa em contencioso fiscal.",
      features: [
        "Planejamento tributário",
        "Processos administrativos",
        "Recuperação de créditos",
        "Consultoria fiscal"
      ]
    },
    {
      icon: Home,
      title: "Direito Imobiliário",
      description: "Consultoria e assessoria em transações e litígios imobiliários.",
      features: [
        "Compra e venda",
        "Incorporações",
        "Direito condominial",
        "Locações"
      ]
    },
    {
      icon: Gavel,
      title: "Direito Penal",
      description: "Defesa técnica em processos criminais e crimes empresariais.",
      features: [
        "Defesa criminal",
        "Crimes empresariais",
        "Recursos",
        "Habeas corpus"
      ]
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
            Áreas de Atuação
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Especialização em diferentes ramos do Direito para empresas e pessoas físicas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-gray-200 rounded-sm shadow-none hover:shadow-none transition-none">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mx-auto mb-3">
                  <service.icon className="h-7 w-7 text-blue-900" />
                </div>
                <CardTitle className="text-lg text-blue-900">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{service.description}</p>
                <ul className="space-y-1">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-blue-900 rounded mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-base text-gray-700 mb-5">
            Para outras áreas do direito, envie sua demanda para análise técnica.
          </p>
          <button className="bg-blue-900 hover:bg-blue-950 text-white px-8 py-3 rounded border-0 font-medium transition-colors duration-200">
            Solicitar Consulta
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
