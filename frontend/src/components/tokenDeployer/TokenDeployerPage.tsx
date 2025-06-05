import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import TokenDeployerForm from './TokenDeployerForm';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';


const TokenDeployerPage = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col pt-14 bg-white">
      <div className={`w-full px-4 ${currentStep <= 3 ? 'max-w-4xl mx-auto' : 'container mx-auto'}`}>
        {
          currentStep <= 3 &&(
            <>
              <h1 className="text-3xl font-bold text-center mb-2">Token Deployer</h1>
              <p className="text-center text-gray-500 mb-8">Easily create and mint your own SPL Token without coding.</p>
            </>
          )
        }
        <TokenDeployerForm currentStep={currentStep} setCurrentStep={setCurrentStep}/>
        {
          currentStep <= 3 && (
            <div className="flex justify-between mt-10">
              <Button 
                variant="outline" 
                className="px-8" 
                onClick={() => navigate({ to: '/' })}
              >
                Cancel
              </Button>
              <Button 
                className="px-8 flex items-center gap-2 bg-black text-white" 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 5}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default TokenDeployerPage; 