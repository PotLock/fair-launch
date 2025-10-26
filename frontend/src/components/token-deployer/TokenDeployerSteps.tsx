import React from 'react';
import type { TokenDeployerSteps } from '../../types';

const steps = [
  {
    label: 'Select Token template',
    description: 'Choose a template that best fits your token\'s purpose',
  },
  {
    label: 'Select Token Template',
    description: 'Choose who and how your token will be distributed before it goes to decentralized exchanges',
  },
  {
    label: 'Select Pricing Mechanism',
    description: 'Set up a vesting schedule for your token',
  },
  {
    label: 'Review Your Selection',
    description: 'Review your selection and deploy your token'
  }
]

const TokenDeployerSteps = ({ currentStep }: TokenDeployerSteps) => {
  return (
    <div className="flex flex-col gap-12 mb-4">
      <div className="flex items-center justify-center">
        {steps.map((_, index) => (
          <React.Fragment key={index}>
            <div
              className={`w-7 h-7 rounded-full flex items-center text-sm justify-center text-white 
                ${currentStep === index ? 'bg-green-500' : index < currentStep ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              {index + 1}
            </div>
            {index !== steps.length - 1 && (
              <div className="md:w-36 w-16 h-0.5 bg-gray-200 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold mb-1">{steps[currentStep].label}</h2>
        <p className="text-gray-500 mb-6">{steps[currentStep].description}</p>
      </div>
    </div>
  );
};

export default TokenDeployerSteps; 