import { TokenTemplate, Exchanges, TemplateCurve, PreviewSelection, TokenCreation } from './steps';
import TokenDeployerSteps from './TokenDeployerSteps';

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
        return <TemplateCurve />
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