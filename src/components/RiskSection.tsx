
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const RiskSection = () => {
  const stats = [
    {
      number: "3M+",
      label: "Processos Trabalhistas",
      description: "São abertos anualmente no Brasil segundo o TST"
    },
    {
      number: "99%",
      label: "Patrimônio em Risco",
      description: "Casos de inadimplência empresarial atingem bens pessoais dos sócios"
    },
    {
      number: "R$ 500k+",
      label: "Valor Médio",
      description: "Das condenações trabalhistas em empresas de médio porte"
    }
  ];

  return (
    <section className="py-16 bg-red-50 border-t border-red-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-red-900 mb-4">
            99% dos Empresários Não Sabem:
          </h2>
          <p className="text-xl text-red-800 font-medium">
            Processos Trabalhistas Podem Atingir Seu Patrimônio Pessoal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-red-200 rounded-sm shadow-none bg-white">
              <CardContent className="p-7">
                <div className="text-4xl font-bold text-red-900 mb-2">{stat.number}</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">{stat.label}</h3>
                <p className="text-sm text-red-700 leading-relaxed">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RiskSection;
