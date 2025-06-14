
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, FileText, Briefcase, Home, Gavel } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Building,
      title: "Direito Empresarial",
      description: "Consultoria jurídica completa para empresas, incluindo contratos, fusões, aquisições e compliance corporativo.",
      features: ["Constituição de empresas", "Contratos comerciais", "Fusões e aquisições", "Compliance"]
    },
    {
      icon: Users,
      title: "Direito Trabalhista",
      description: "Assessoria em relações de trabalho, tanto para empregadores quanto empregados, incluindo processos trabalhistas.",
      features: ["Consultoria preventiva", "Processos trabalhistas", "Negociações coletivas", "Auditorias trabalhistas"]
    },
    {
      icon: FileText,
      title: "Direito Civil",
      description: "Soluções em direito civil, incluindo contratos, responsabilidade civil e questões patrimoniais.",
      features: ["Contratos diversos", "Responsabilidade civil", "Direito das obrigações", "Questões patrimoniais"]
    },
    {
      icon: Briefcase,
      title: "Direito Tributário",
      description: "Planejamento tributário e defesa em processos fiscais para otimização da carga tributária.",
      features: ["Planejamento tributário", "Processos administrativos", "Recuperação de créditos", "Consultoria fiscal"]
    },
    {
      icon: Home,
      title: "Direito Imobiliário",
      description: "Assessoria completa em transações imobiliárias, incorporações e questões condominiais.",
      features: ["Compra e venda", "Incorporações", "Direito condominial", "Locações"]
    },
    {
      icon: Gavel,
      title: "Direito Penal",
      description: "Defesa criminal em todas as instâncias, com foco na proteção dos direitos fundamentais.",
      features: ["Defesa criminal", "Crimes empresariais", "Recursos", "Habeas corpus"]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6">
            Nossas Áreas de Atuação
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Oferecemos expertise especializada em diversas áreas do direito, 
            sempre com foco na excelência e nos resultados que nossos clientes merecem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <service.icon className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-blue-900">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-gray-500">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-8">
            Não encontrou a área que procura? Entre em contato conosco para uma consulta personalizada.
          </p>
          <button className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-300">
            Solicitar Consulta
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
