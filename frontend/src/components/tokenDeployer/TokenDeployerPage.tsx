import React from 'react';
import TokenDeployerForm from './TokenDeployerForm';
import TokenDeployerHeader from './TokenDeployerHeader';

const TokenDeployerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <TokenDeployerHeader />
        <TokenDeployerForm />
      </div>
    </div>
  );
};

export default TokenDeployerPage; 