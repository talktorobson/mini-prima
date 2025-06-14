
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Team = () => {
  return (
    <section className="py-16 bg-navy-800 border-t border-navy-700">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3">
            Expertise Reconhecida
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Nossa equipe combina décadas de experiência com conhecimento especializado em direito empresarial
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="text-center border-navy-600 rounded-sm shadow-none bg-navy-700">
            <CardContent className="p-8">
              <div className="w-20 h-20 bg-amber-500 rounded-full mx-auto mb-5 flex items-center justify-center">
                <span className="text-navy-900 font-bold text-lg">DR</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Dr. D'avila Reis</h3>
              <p className="text-amber-400 font-medium mb-3">Sócio-Fundador</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                Mais de 20 anos de experiência em direito trabalhista empresarial. 
                Especialista em defesa de empresários e blindagem patrimonial.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Carreiras */}
        <div className="mt-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-semibold text-white mb-3">
              Faça Parte da Nossa Equipe
            </h3>
            <p className="text-gray-300">
              Construa sua carreira em um dos escritórios mais respeitados do direito empresarial
            </p>
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-white mb-6 text-center">
              Por que trabalhar na D'avila Reis?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { emoji: "🚀", title: "Crescimento Profissional", desc: "Ambiente que valoriza o desenvolvimento e oferece oportunidades reais de crescimento" },
                { emoji: "💼", title: "Cases Desafiadores", desc: "Trabalhe com empresas de grande porte em casos complexos e estratégicos" },
                { emoji: "🏆", title: "Reconhecimento", desc: "Faça parte de uma equipe reconhecida pela excelência e resultados" },
                { emoji: "⚖️", title: "Tradição + Inovação", desc: "20 anos de mercado combinados com as mais modernas ferramentas jurídicas" }
              ].map((item, index) => (
                <Card key={index} className="border-navy-600 rounded-sm shadow-none bg-navy-700">
                  <CardContent className="p-5 text-center">
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <h5 className="font-semibold text-white mb-2 text-sm">{item.title}</h5>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-lg font-semibold text-white mb-4">Oportunidades Abertas</h4>
            <p className="text-gray-300 mb-6 text-sm">
              Temos vagas para profissionais que querem fazer a diferença no direito empresarial e trabalhista.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { title: "Advogado Júnior", subtitle: "Direito Trabalhista" },
                { title: "Estagiário em Direito", subtitle: "4h/dia - Manhã ou Tarde" },
                { title: "Assistente Administrativo", subtitle: "8h/dia - Presencial" }
              ].map((vaga, index) => (
                <Card key={index} className="border-navy-600 rounded-sm shadow-none bg-navy-700">
                  <CardContent className="p-4 text-center">
                    <h5 className="font-semibold text-white text-sm">{vaga.title}</h5>
                    <p className="text-xs text-gray-300">{vaga.subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <button className="bg-amber-500 hover:bg-amber-600 text-navy-900 px-6 py-2 rounded text-sm font-medium transition-colors duration-200 mr-4">
              Ver Todas as Vagas →
            </button>
            <button className="border border-amber-500 text-amber-400 px-6 py-2 rounded text-sm font-medium hover:bg-navy-700 transition-colors duration-200">
              Cadastre seu Currículo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;
