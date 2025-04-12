import React from 'react';
import TokenDeployerForm from './TokenDeployerForm';
import TokenDeployerHeader from './TokenDeployerHeader';
import { TokenDeployerProvider } from '../../context/TokenDeployerContext';

const TokenDeployerPage: React.FC = () => {
  return (
    <TokenDeployerProvider>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <TokenDeployerHeader />
          <TokenDeployerForm />
        </div>
      </div>
    </TokenDeployerProvider>
  );
};

export default TokenDeployerPage; 