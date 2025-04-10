import React from 'react';

const TokenDeployerHeader: React.FC = () => {
  return (
    <div className="text-center mb-12 space-y-6 mt-6">
      <h1 className="text-4xl font-semibold mb-2">Token Deployer</h1>
      <p className="text-gray-600 text-sm max-w-lg mx-auto">
        Easily create and mint your own SPL Token without coding.
        Customize with standards supply, and add logo.
      </p>
    </div>
  );
};

export default TokenDeployerHeader; 