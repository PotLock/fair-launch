import { Plus, Trash2 } from 'lucide-react';
import { IconArrowLeft,IconArrowRight } from '@tabler/icons-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';

interface AllocationItem {
    description: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
}

interface AllocationProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const Allocation = ({ setCurrentStep, currentStep }: AllocationProps) => {
    const { state, updateAllocation, setStepEnabled, validateAllocation } = useTokenDeployer();

    const remainingPercentage = 100 - state.allocation.data.reduce((sum, item) => sum + item.percentage, 0);

    const handleAddAllocation = () => {
        updateAllocation([...state.allocation.data, {
            description: '',
            percentage: Math.min(30, remainingPercentage),
            walletAddress: '',
            lockupPeriod: 0
        }]);
    };

    const handleRemoveAllocation = (index: number) => {
        updateAllocation(state.allocation.data.filter((_, i) => i !== index));
    };

    const updateAllocationItem = (index: number, field: keyof AllocationItem, value: string | number) => {
        const newAllocations = [...state.allocation.data];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        updateAllocation(newAllocations);
    };

    const handleNext = () => {
        if (!state.allocation.enabled || validateAllocation()) {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h1 className="text-lg font-bold">Token Allocations</h1>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Remaining: {remainingPercentage}%</span>
                    <button
                        onClick={() => setStepEnabled('allocation', !state.allocation.enabled)}
                        className={`
                        relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                        ${state.allocation.enabled ? 'bg-black' : 'bg-gray-200'}
                        `}
                    >
                        <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                            ${state.allocation.enabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                        />
                    </button>
                </div>
            </div>

            {state.allocation.enabled && (
                <>
                    {state.allocation.errors?.totalPercentage && (
                        <div className="text-red-500 text-sm mt-2">
                            {state.allocation.errors.totalPercentage}
                        </div>
                    )}

                    <button
                        onClick={handleAddAllocation}
                        disabled={remainingPercentage <= 0}
                        className="mt-6 w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" /> Add Allocation
                    </button>

                    <div className="space-y-6">
                        {state.allocation.data.map((allocation, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Allocation #{index + 1}</h3>
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        onClick={() => handleRemoveAllocation(index)}
                                    >
                                        <Trash2 className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className='space-y-2'>
                                        <label className="text-sm text-black font-medium mt-1 block">Description (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g Team"
                                            value={allocation.description}
                                            onChange={(e) => updateAllocationItem(index, 'description', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-sm"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex flex-col">
                                            <label htmlFor="percentage" className="text-sm text-black font-medium mt-1 block">Percentage: {allocation.percentage}%</label>
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    value={allocation.percentage}
                                                    onChange={(e) => updateAllocationItem(index, 'percentage', parseInt(e.target.value))}
                                                    max={100}
                                                    step={1}
                                                    className="w-full h-3 bg-gray-200 rounded-lg cursor-pointer accent-black"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 block">Percentage of your token supply</span>
                                    </div>

                                    <div className='space-y-2'>
                                        <label className="text-sm text-black font-medium mt-1 block">Wallet Address</label>
                                        <input
                                            type="text"
                                            placeholder="Solana Wallet address"
                                            value={allocation.walletAddress}
                                            onChange={(e) => updateAllocationItem(index, 'walletAddress', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-sm ${
                                                state.allocation.errors?.walletAddresses?.[index] 
                                                ? 'border-red-500' 
                                                : 'border-gray-300'
                                            }`}
                                        />
                                        {state.allocation.errors?.walletAddresses?.[index] && (
                                            <div className="text-red-500 text-sm">
                                                {state.allocation.errors.walletAddresses[index]}
                                            </div>
                                        )}
                                    </div>

                                    <div className='space-y-2'>
                                        <label className="text-sm text-black font-medium mt-1 block">Lockup Period (days)</label>
                                        <input
                                            type="number"
                                            value={allocation.lockupPeriod}
                                            onChange={(e) => updateAllocationItem(index, 'lockupPeriod', parseInt(e.target.value))}
                                            min={0}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

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
                    onClick={handleNext}
                    disabled={currentStep === 3}
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Allocation;