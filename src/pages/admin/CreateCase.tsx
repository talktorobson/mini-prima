// 📝 Create Case Page
// D'Avila Reis Legal Practice Management System

import React from 'react';
import { CaseForm } from '@/components/admin/CaseForm';

const CreateCase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <CaseForm />
    </div>
  );
};

export default CreateCase;