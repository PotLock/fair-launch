import TokenDeployerSteps from './TokenDeployerSteps';
import { TokenTemplate } from './steps/TokenTemplate';
import { Exchanges } from './steps/Exchanges';
import { PricingMechaism } from './steps/PricingMechaism';
import { PreviewSelection } from './steps/PreviewSelection';
import { TokenCreation } from './TokenCreation';

interface TokenDeployerFormProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const TokenDeployerForm = ({ currentStep }: TokenDeployerFormProps) => {
  const renderComponents = (step: number) => {
    switch (step) {
      case 0:
        return <TokenTemplate/>
      case 1:
        return <Exchanges />
      case 2:
        return <PricingMechaism />
      case 3:
        return <PreviewSelection />
      case 4:
        return <TokenCreation />
      default:
        return null;
    }
  };

  return (
    <>
      {
        currentStep <= 3 && (
          <TokenDeployerSteps currentStep={currentStep} />
        )
      }
      {renderComponents(currentStep)}
    </>
  );
};

export default TokenDeployerForm; 