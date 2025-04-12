import { Plus, Trash2 } from 'lucide-react';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { useState } from 'react';

interface VestingItem {
    description: string;
    percentage: number;
    cliffPeriod: number;
    vestingDuration: number;
    vestingInterval: number;
}

interface VestingErrors {
    totalPercentage?: string;
    items?: {
        cliffPeriod?: string;
        vestingDuration?: string;
        vestingInterval?: string;
    }[];
}

interface VestingProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const Vesting = ({ setCurrentStep, currentStep }: VestingProps) => {
    const { state, updateVesting, setStepEnabled } = useTokenDeployer();
    const [errors, setErrors] = useState<VestingErrors>({});

    const remainingPercentage = 100 - state.vesting.data.reduce((sum, item) => sum + item.percentage, 0);

    const validateVesting = (): boolean => {
        if (!state.vesting.enabled) return true;

        const newErrors: VestingErrors = {};
        const itemErrors: NonNullable<VestingErrors['items']> = [];
        let hasErrors = false;

        if (state.vesting.data.length === 0) {
            newErrors.totalPercentage = 'At least one vesting schedule is required';
            hasErrors = true;
        }

        // Validate each vesting schedule
        state.vesting.data.forEach((item, index) => {
            const itemError = {
                cliffPeriod: undefined as string | undefined,
                vestingDuration: undefined as string | undefined,
                vestingInterval: undefined as string | undefined
            };

            if (item.cliffPeriod < 0) {
                itemError.cliffPeriod = 'Cliff period cannot be negative';
                hasErrors = true;
            }

            if (item.vestingDuration <= 0) {
                itemError.vestingDuration = 'Vesting duration must be greater than 0';
                hasErrors = true;
            }

            if (item.vestingInterval <= 0) {
                itemError.vestingInterval = 'Vesting interval must be greater than 0';
                hasErrors = true;
            }

            if (item.vestingInterval > item.vestingDuration) {
                itemError.vestingInterval = 'Vesting interval cannot be greater than duration';
                hasErrors = true;
            }

            if (Object.keys(itemError).length > 0) {
                itemErrors[index] = itemError;
            }
        });

        if (itemErrors.length > 0) {
            newErrors.items = itemErrors;
        }

        setErrors(newErrors);
        return !hasErrors;
    };

    const handleAddVesting = () => {
        updateVesting([...state.vesting.data, {
            description: '',
            percentage: Math.min(30, remainingPercentage),
            cliffPeriod: 0,
            vestingDuration: 0,
            vestingInterval: 0
        }]);
    };

    const handleRemoveVesting = (index: number) => {
        updateVesting(state.vesting.data.filter((_, i) => i !== index));
    };

    const updateVestingItem = (index: number, field: keyof VestingItem, value: string | number) => {
        const newVestings = [...state.vesting.data];
        newVestings[index] = { ...newVestings[index], [field]: value };
        updateVesting(newVestings);
    };

    const handleNext = () => {
        if (validateVesting()) {
            setCurrentStep(currentStep + 1);
        }
    };

    return (
        <div className="w-full space-y-6 relative">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Vesting Schedule</h1>
                    <p className="text-xs text-gray-500">Define how tokens will be released over time.</p> 
                </div>
                <button
                    onClick={() => setStepEnabled('vesting', !state.vesting.enabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${state.vesting.enabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${state.vesting.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>

            {errors.totalPercentage && (
                <div className="text-red-500 text-sm">{errors.totalPercentage}</div>
            )}

            {state.vesting.enabled && (
                <>                    
                    <button
                        onClick={handleAddVesting}
                        disabled={remainingPercentage <= 0}
                        className="mt-6 w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" /> Add Vesting Schedule
                    </button>

                    <div className="space-y-6">
                        {state.vesting.data.map((vesting, index) => (
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
                                                onChange={(e) => updateVestingItem(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-600 font-medium block mb-2">Percentage: {vesting.percentage}%</label>
                                            <div className="space-y-2">
                                                <input
                                                    type="range"
                                                    value={vesting.percentage}
                                                    onChange={(e) => updateVestingItem(index, 'percentage', parseInt(e.target.value))}
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
                                                value={vesting.cliffPeriod}
                                                onChange={(e) => updateVestingItem(index, 'cliffPeriod', parseInt(e.target.value))}
                                                min={0}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm ${errors.items?.[index]?.cliffPeriod ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            {errors.items?.[index]?.cliffPeriod && (
                                                <p className="text-red-500 text-xs mt-1">{errors.items[index].cliffPeriod}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Period before tokens start vesting</p>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-600 font-medium block mb-2">Vesting Duration (days)</label>
                                            <input
                                                type="number"
                                                placeholder="720"
                                                value={vesting.vestingDuration}
                                                onChange={(e) => updateVestingItem(index, 'vestingDuration', parseInt(e.target.value))}
                                                min={1}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm ${errors.items?.[index]?.vestingDuration ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            {errors.items?.[index]?.vestingDuration && (
                                                <p className="text-red-500 text-xs mt-1">{errors.items[index].vestingDuration}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Total duration of the vesting period</p>
                                        </div>

                                        <div>
                                            <label className="text-sm text-gray-600 font-medium block mb-2">Vesting Interval (days)</label>
                                            <input
                                                type="number"
                                                placeholder="36"
                                                value={vesting.vestingInterval}
                                                onChange={(e) => updateVestingItem(index, 'vestingInterval', parseInt(e.target.value))}
                                                min={1}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm ${errors.items?.[index]?.vestingInterval ? 'border-red-500' : 'border-gray-300'}`}
                                            />
                                            {errors.items?.[index]?.vestingInterval && (
                                                <p className="text-red-500 text-xs mt-1">{errors.items[index].vestingInterval}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">How often tokens are released</p>
                                        </div>
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
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Vesting;