import { useState } from 'react';
import { IconArrowLeft,IconArrowRight } from '@tabler/icons-react';


interface BondingCurveProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const BondingCurve = ({ setCurrentStep, currentStep }: BondingCurveProps) => {
    const [isEnabled, setIsEnabled] = useState<boolean>(false);

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Bonding Curve</h1>
                    <p className="text-xs text-gray-500">Configure a bonding curve to determine token price based on supply. This creates a dynamic pricing mechanism.</p> 
                </div>
                <button
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${isEnabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>


            <div className="flex flex-row gap-2 justify-between">
                <button 
                    className="border border-gray-300 text-gray-500 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex flex-row gap-2 items-center justify-center" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                >
                    <IconArrowLeft className="w-4 h-4" />
                    Previous
                </button>
                <button 
                    className="bg-black text-white py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors flex flex-row gap-2 items-center justify-center" 
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={currentStep === 3}
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default BondingCurve;