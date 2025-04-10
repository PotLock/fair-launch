import React, { useState } from 'react';
import TokenDeployerSteps from './TokenDeployerSteps';
import BasicInformation from './steps/BasicInformation';
import Allocation from './steps/Allocation';
import Vesting from './steps/Vesting';
import BondingCurve from './steps/BondingCurve';

const TokenDeployerForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };


  const renderComponents = (step: number) => {
    switch (step) {
      case 0:
        return <BasicInformation setCurrentStep={setCurrentStep} currentStep={currentStep}/>
      case 1:
        return <Allocation setCurrentStep={setCurrentStep} currentStep={currentStep}/>
      case 2:
        return <Vesting setCurrentStep={setCurrentStep} currentStep={currentStep}/>
      case 3:
        return <BondingCurve setCurrentStep={setCurrentStep} currentStep={currentStep}/>
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-8">
      <div className="flex-shrink-0">
        <TokenDeployerSteps currentStep={currentStep} onStepClick={handleStepClick} />
      </div>
      <div className="flex-grow bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderComponents(currentStep)}
      </div>
    </div>
  );
};

export default TokenDeployerForm; 