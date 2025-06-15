
import React from 'react';

interface WelcomeSectionProps {
  clientName?: string;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ clientName }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Bem-vindo, {clientName || 'Cliente'}!
      </h2>
      <p className="text-gray-600">
        Aqui você pode acompanhar seus processos, documentos e comunicações.
      </p>
    </div>
  );
};

export default WelcomeSection;
