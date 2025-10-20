"use client"

import { useState } from 'react';
import TokenInfo from './token-info';
import DBCConfig from './dbc-config';
import FeeConfig from './fee-config';
import Vesting from './vesting';
import Liquidity from './liquidity';
import Authority from './authority';
import PreviewDeployment from './preview-deployment';
import { CustomMintData } from '@/types/token';

type CustomStep = 'tokenInfo' | 'dbcConfig' | 'baseFeeParams' | 'lockedVestingParam' | 'lpDistribution' | 'authority' | 'previewDeployment';

const steps: CustomStep[] = [
  'tokenInfo',
  'dbcConfig',
  'baseFeeParams',
  'lockedVestingParam',
  'lpDistribution',
  'authority',
  'previewDeployment'
];

export default function CustomToken() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<CustomMintData>>({});

  const currentStep = steps[currentStepIndex];

  const handleNext = (stepData: any) => {
    setFormData(prev => ({
      ...prev,
      [currentStep]: stepData
    }));
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // All steps completed, submit the form
      console.log('Final form data:', { ...formData, [currentStep]: stepData });
      // TODO: Implement final submission logic
    }
  };

  const handleCancel = () => {
    setCurrentStepIndex(0);
    setFormData({});
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'tokenInfo':
        return (
          <TokenInfo
            onNext={handleNext}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.tokenInfo}
          />
        );
      case 'dbcConfig':
        return (
          <DBCConfig
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.dbcConfig}
          />
        );
      case 'baseFeeParams':
        return (
          <FeeConfig
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.baseFeeParams}
          />
        );
      case 'lockedVestingParam':
        return (
          <Vesting
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.lockedVestingParam}
          />
        );
      case 'lpDistribution':
        return (
          <Liquidity
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.lpDistribution}
          />
        );
      case 'authority':
        return (
          <Authority
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            initialData={formData.authority}
          />
        );
      case 'previewDeployment':
        return (
          <PreviewDeployment
            onBack={handleBack}
            onCancel={handleCancel}
            currentStep={currentStepIndex + 1}
            totalSteps={steps.length}
            formData={formData}
          />
        );
      default:
        return (
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Unknown Step</h1>
              <p className="text-gray-600 mb-8">Something went wrong...</p>
              <div className="flex gap-4">
                <button 
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderCurrentStep();
}