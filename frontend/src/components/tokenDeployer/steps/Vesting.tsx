import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { IconArrowLeft,IconArrowRight } from '@tabler/icons-react';

interface VestingItem {
    description: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
}


interface VestingProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const Vesting = ({ setCurrentStep, currentStep }: VestingProps) => {
    const [vestings, setVestings] = useState<VestingItem[]>([
        { description: '', percentage: 20, walletAddress: '', lockupPeriod: 0 }
    ]);
    const [isEnabled, setIsEnabled] = useState(false);

    const remainingPercentage = 100 - vestings.reduce((sum, item) => sum + item.percentage, 0);

    const handleAddVesting = () => {
        setVestings([...vestings, {
            description: '',
            percentage: Math.min(30, remainingPercentage),
            walletAddress: '',
            lockupPeriod: 0
        }]);
    };

    const handleRemoveVesting = (index: number) => {
        setVestings(vestings.filter((_, i) => i !== index));
    };

    const updateVesting = (index: number, field: keyof VestingItem, value: string | number) => {
        const newVestings = [...vestings];
        newVestings[index] = { ...newVestings[index], [field]: value };
        setVestings(newVestings);
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Vesting Schedule</h1>
                    <p className="text-xs text-gray-500">Define how token will be released.</p> 
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

            <button
                onClick={handleAddVesting}
                disabled={remainingPercentage <= 0}
                className="mt-6 w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" /> Add Vesting
            </button>

            <div className="space-y-6">
                {vestings.map((vesting, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Vesting Schedule #{index + 1}</h3>
                            <button
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                onClick={() => handleRemoveVesting(index)}
                            >
                                <Trash2 className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <label className="text-sm text-gray-600 font-medium block">Description (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g Team"
                                        value={vesting.description}
                                        onChange={(e) => updateVesting(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium block mb-2">Percentage: {vesting.percentage}%</label>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            value={vesting.percentage}
                                            onChange={(e) => updateVesting(index, 'percentage', parseInt(e.target.value))}
                                            max={100}
                                            step={1}
                                            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-black"
                                        />
                                        <p className="text-xs text-gray-500">Percentage of Total Supply</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-gray-600 font-medium block mb-2">Cliff Period (days)</label>
                                    <input
                                        type="number"
                                        placeholder="180"
                                        value={vesting.lockupPeriod}
                                        onChange={(e) => updateVesting(index, 'lockupPeriod', parseInt(e.target.value))}
                                        min={0}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Period before tokens start vesting</p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium block mb-2">Vesting Duration (days)</label>
                                    <input
                                        type="number"
                                        placeholder="720"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Total duration of the vesting period</p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 font-medium block mb-2">Vesting Interval (days)</label>
                                    <input
                                        type="number"
                                        placeholder="36"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">How often tokens are released</p>
                                </div>
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

export default Vesting;