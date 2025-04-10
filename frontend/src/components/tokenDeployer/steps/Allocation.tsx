import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IconArrowLeft,IconArrowRight } from '@tabler/icons-react';

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
    const [allocations, setAllocations] = useState<AllocationItem[]>([
        { description: '', percentage: 20, walletAddress: '', lockupPeriod: 0 }
    ]);

    const remainingPercentage = 100 - allocations.reduce((sum, item) => sum + item.percentage, 0);

    const handleAddAllocation = () => {
        setAllocations([...allocations, {
            description: '',
            percentage: Math.min(30, remainingPercentage),
            walletAddress: '',
            lockupPeriod: 0
        }]);
    };

    const handleRemoveAllocation = (index: number) => {
        setAllocations(allocations.filter((_, i) => i !== index));
    };

    const updateAllocation = (index: number, field: keyof AllocationItem, value: string | number) => {
        const newAllocations = [...allocations];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        setAllocations(newAllocations);
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h1 className="text-lg font-bold">Token Allocations</h1>
                <span className="text-gray-600">Remaining: {remainingPercentage}%</span>
            </div>

            <button
                onClick={handleAddAllocation}
                disabled={remainingPercentage <= 0}
                className="mt-6 w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" /> Add Allocation
            </button>

            <div className="space-y-6">
                {allocations.map((allocation, index) => (
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateAllocation(index, 'description', e.target.value)
                                    }
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
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                                updateAllocation(index, 'percentage', parseInt(e.target.value))
                                            }
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
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateAllocation(index, 'walletAddress', e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-sm"
                                />
                            </div>

                            <div className='space-y-2'>
                                <label className="text-sm text-black font-medium mt-1 block">Lockup Period (days)</label>
                                <input
                                    type="number"
                                    value={allocation.lockupPeriod}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                        updateAllocation(index, 'lockupPeriod', parseInt(e.target.value))
                                    }
                                    min={0}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
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

export default Allocation;