// ✏️ Edit Case Page
// D'Avila Reis Legal Practice Management System

import React from 'react';
import { useParams } from 'react-router-dom';
import { CaseForm } from '@/components/admin/CaseForm';

const EditCase: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();

  if (!caseId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Caso não encontrado</h2>
          <p className="text-gray-600">ID do caso não fornecido na URL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CaseForm caseId={caseId} />
    </div>
  );
};

export default EditCase;