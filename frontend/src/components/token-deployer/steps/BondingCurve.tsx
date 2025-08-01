import { IconArrowLeft, IconArrowRight, IconChevronDown } from '@tabler/icons-react';
import { OctagonAlert } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';

interface BondingCurveProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const BondingCurve = ({ setCurrentStep, currentStep }: BondingCurveProps) => {
    const { state, updateBondingCurve, setStepEnabled } = useTokenDeployer();

    const handleCurveTypeChange = (value: string) => {
        updateBondingCurve({ curveType: value });
    };

    const handleMaxSupplyChange = (value: number) => {
        updateBondingCurve({ maxSupply: value });
    };

    const handlePriceChange = (field: 'initialPrice' | 'targetPrice', value: string) => {
        const numValue = value.replace(/,/g, '.');
        
        updateBondingCurve({ [field]: numValue });
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Bonding Curve</h1>
                    <p className="text-xs text-gray-500">Configure a bonding curve to determine token price based on supply. This creates a dynamic pricing mechanism.</p> 
                </div>
                <button
                    onClick={() => setStepEnabled('bondingCurve', !state.bondingCurve.enabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${state.bondingCurve.enabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${state.bondingCurve.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>

            {
                state.bondingCurve.enabled && (
                    <div className="space-y-6">
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-center'>
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Curve Type</label>
                                <div className="relative">
                                    <select
                                        value={state.bondingCurve.data.curveType || ''}
                                        onChange={(e) => handleCurveTypeChange(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md appearance-none bg-transparent pr-10 cursor-pointer"
                                    >
                                        <option value="Linear" selected>Linear</option>
                                        <option value="Exponential">Exponential</option>
                                        <option value="Polynomial">Polynomial</option>
                                    </select>
                                    <IconChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                                </div>
                                <p className="text-xs text-gray-500">The mathematical function that determines the price curve</p>
                            </div>

                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Max Supply ({state.bondingCurve.data.maxSupply})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100000000"
                                    value={state.bondingCurve.data.maxSupply}
                                    onChange={(e) => handleMaxSupplyChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg accent-black cursor-pointer"
                                />
                                <p className="text-xs text-gray-500">Maximum supply that can be minted through the bonding curve</p>
                            </div>
                        </div>

                        {/* Price Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Initial Price(SOL)</label>
                                <input
                                    type="text"
                                    value={state.bondingCurve.data.initialPrice}
                                    placeholder='0.02'
                                    onChange={(e) => handlePriceChange('initialPrice', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500">The starting price of the token</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Target Price(SOL)</label>
                                <input
                                    type="number"
                                    value={state.bondingCurve.data.targetPrice || ''}
                                    placeholder='1'
                                    onChange={(e) => handlePriceChange('targetPrice', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    step="0.01"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500">The price when target raise is reached</p>
                            </div>
                        </div>

                        {/* What this means */}
                        <div className="bg-blue-50 p-4 rounded-md space-y-2">
                            <h3 className="text-sm font-medium flex items-center gap-2">
                                <OctagonAlert className='w-4 h-4 text-black' />
                                What this means
                            </h3>
                            <ul className="text-sm space-y-1 list-disc pl-10">
                                <li>Token price will start at {state.bondingCurve.data.initialPrice} SOL and can reach up to {state.bondingCurve.data.targetPrice} SOL</li>
                                <li>Price increases as more tokens are purchased, following a {state.bondingCurve.data.curveType} curve</li>
                                <li>Maximum supply through bonding curve: {state.bondingCurve.data.maxSupply} tokens</li>
                            </ul>
                        </div>
                    </div>
                )
            }

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
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default BondingCurve;