
import React from 'react';
import ClientRegistrationForm from '@/components/admin/ClientRegistrationForm';

const ClientRegistration = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Cadastro de Cliente
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Inicie seu relacionamento conosco preenchendo o formulário abaixo. 
            Nossa equipe analisará seu cadastro e entrará em contato em breve.
          </p>
        </div>
        
        <ClientRegistrationForm />
      </div>
    </div>
  );
};

export default ClientRegistration;
