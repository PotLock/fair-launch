import React from 'react';
import { IconCircleCheck } from '@tabler/icons-react';
import { steps } from '../../utils/comon';


const TokenDeployerSteps: React.FC<{ currentStep: number }> = ({
  currentStep,
}) => {
  return (
    <div className="w-64 bg-white rounded-lg border border-gray-200">
      <div className='bg-gray-100 rounded-t-lg p-3'>
        <h2 className="text-lg font-semibold">Form Sections</h2>
      </div>
      <div className='p-4 space-y-2'>
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex gap-3 group items-center rounded-lg p-2 ${index <= currentStep && 'bg-gray-100/80'}`}
          >
            {index <= currentStep ? (
              <IconCircleCheck className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                currentStep === index 
                  ? 'border-gray-900' 
                  : 'border-gray-300'
              }`} />
            )}
            <div>
              <h3 className={`text-sm font-medium text-gray-900`}>
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 p-4 bg-blue-50">
        <p className="text-sm text-blue-600">Need help?</p>
        <p className="text-xs text-blue-500">Fields marked with <strong className='font-semibold text-red-500'>*</strong> are required</p>
      </div>
    </div>
  );
};

export default TokenDeployerSteps; 