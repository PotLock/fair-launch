import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import TokenDeployerForm from './TokenDeployerForm';
import { useNavigate } from '@tanstack/react-router';
import { useDeployStore } from '../../stores/deployStores';


const TokenDeployerPage = () => {
  const { currentStep, setCurrentStep } = useDeployStore();
  const navigate = useNavigate();

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate({ to: '/' });
    }
  };

  return (
    <div className="flex flex-col pt-14 bg-white pb-10">
      <div className={`w-full px-4 ${currentStep <= 3 ? 'max-w-4xl mx-auto' : 'xl:container mx-auto'}`}>
        {
          currentStep <= 3 &&(
            <>
              <h1 className="text-3xl font-bold text-center mb-2">Token Deployer</h1>
              <p className="text-center text-gray-500 mb-8 md:mb-4">Easily create and mint your own SPL Token without coding.</p>
            </>
          )
        }
        <TokenDeployerForm currentStep={currentStep} setCurrentStep={setCurrentStep}/>
        {
          currentStep <= 3 && (
            <div className="flex justify-between md:mt-10 mt-3">
              <Button 
                variant="outline" 
                className="px-8" 
                onClick={handlePrevious}
              >
                {currentStep > 0 ? 'Previous' : 'Cancel'}
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