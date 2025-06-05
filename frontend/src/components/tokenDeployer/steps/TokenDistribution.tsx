import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { Input } from '../../ui/input';

interface VestingParams {
    enabled: boolean;
    description: string;
    percentage: number;
    cliff: number;
    duration: number;
    interval: number;
}

interface TokenDistributionItem {
    description: string;
    percentage: number;
    walletAddress: string;
    lockupPeriod: number;
    vesting?: VestingParams;
}

export const TokenDistribution = () => {
    const { state, updateAllocation } = useTokenDeployer();
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [vestingEnabled, setVestingEnabled] = useState<boolean[]>(state.allocation.data.map(() => false));

    const remainingPercentage = 100 - state.allocation.data.reduce((sum, item) => sum + item.percentage, 0);

    const handleAddAllocation = () => {
        updateAllocation([
            ...state.allocation.data,
            {
                description: '',
                percentage: Math.min(30, remainingPercentage),
                walletAddress: '',
                lockupPeriod: 0,
                vesting: {
                    enabled: false,
                    description: '',
                    percentage: 0,
                    cliff: 0,
                    duration: 0,
                    interval: 0,
                },
            },
        ]);
        setVestingEnabled([...vestingEnabled, false]);
    };

    const handleRemoveAllocation = (index: number) => {
        updateAllocation(state.allocation.data.filter((_, i) => i !== index));
        setVestingEnabled(vestingEnabled.filter((_, i) => i !== index));
    };

    const updateAllocationItem = (index: number, field: keyof TokenDistributionItem, value: string | number) => {
        const newAllocations = [...state.allocation.data];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        updateAllocation(newAllocations);
    };

    const updateVestingField = (index: number, field: string, value: string | number) => {
        const newAllocations = [...state.allocation.data];
        if (!newAllocations[index].vesting) {
            newAllocations[index].vesting = {
                enabled: true,
                description: '',
                percentage: 0,
                cliff: 0,
                duration: 0,
                interval: 0,
            };
        }
        newAllocations[index].vesting = {
            ...newAllocations[index].vesting,
            [field]: value,
        };
        updateAllocation(newAllocations);
    };

    const toggleVesting = (index: number) => {
        setVestingEnabled((prev) => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
        // Optionally update allocation vesting.enabled here
        const newAllocations = [...state.allocation.data];
        if (!newAllocations[index].vesting) {
            newAllocations[index].vesting = {
                enabled: true,
                description: '',
                percentage: 0,
                cliff: 0,
                duration: 0,
                interval: 0,
            };
        } else {
            newAllocations[index].vesting.enabled = !newAllocations[index].vesting.enabled;
        }
        updateAllocation(newAllocations);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className='flex flex-col gap-1'>
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Token Distribution</div>
                    {
                        isExpanded && (
                            <div className="text-sm text-gray-500 mb-4">Define how your tokens will be distributed.</div>
                        )
                    }
                </div>
                <div className="flex items-center gap-2">
                    {
                        isExpanded && (
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-xl flex text-sm items-center gap-2 hover:bg-gray-50"
                                onClick={(e) => { e.stopPropagation(); handleAddAllocation(); }}
                            >
                                <Plus className="w-4 h-4" /> Add Allocation
                            </button>
                        )
                    }
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </div>
            </div>
            
            {isExpanded && (
                <div className="space-y-6">
                    {state.allocation.data.map((allocation, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Allocation #{index + 1}</h3>
                                <button
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    onClick={() => handleRemoveAllocation(index)}
                                >
                                    <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div className='space-y-2'>
                                    <label className="text-sm text-black font-medium mt-1 block">Description (Optional)</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g Team, Advisors, Community, Public Sale"
                                        value={allocation.description}
                                        onChange={(e) => updateAllocationItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-col">
                                        <label htmlFor="percentage" className="text-sm text-black font-medium mt-1 block">
                                            Percentage: {allocation.percentage}%
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({Math.round((allocation.percentage / 100) * Number(state.basicInfo.data.supply)).toLocaleString()} tokens)
                                            </span>
                                        </label>
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
                                    <Input
                                        type="text"
                                        placeholder="Solana Wallet address"
                                        value={allocation.walletAddress}
                                        onChange={(e) => updateAllocationItem(index, 'walletAddress', e.target.value)}
                                        className={state.allocation.errors?.walletAddresses?.[index] ? 'border-red-500' : ''}
                                    />
                                    {state.allocation.errors?.walletAddresses?.[index] && (
                                        <div className="text-red-500 text-sm">
                                            {state.allocation.errors.walletAddresses[index]}
                                        </div>
                                    )}
                                </div>
                                {/* Vesting Schedule Toggle */}
                                <div className="flex items-center gap-2 mt-4">
                                    <label className="text-sm font-medium"></label>
                                    <button
                                        type="button"
                                        onClick={() => toggleVesting(index)}
                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${vestingEnabled[index] ? 'bg-black' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${vestingEnabled[index] ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                                {/* Vesting Fields */}
                                {vestingEnabled[index] && (
                                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1">
                                                <label className="text-sm text-black font-medium block">Description (Optional)</label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g Team"
                                                    value={allocation.vesting?.description || ''}
                                                    onChange={(e) => updateVestingField(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm text-black font-medium block">Percentage: {allocation.vesting?.percentage || 0}%</label>
                                                <input
                                                    type="range"
                                                    value={allocation.vesting?.percentage || 0}
                                                    onChange={(e) => updateVestingField(index, 'percentage', parseInt(e.target.value))}
                                                    max={100}
                                                    step={1}
                                                    className="w-full h-3 bg-gray-200 rounded-lg cursor-pointer accent-black"
                                                />
                                                <span className="text-xs text-gray-500 mt-1 block">Percentage of Total Supply</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1">
                                                <label className="text-sm text-black font-medium block">Cliff Period (days)</label>
                                                <Input
                                                    type="number"
                                                    value={allocation.vesting?.cliff || 0}
                                                    onChange={(e) => updateVestingField(index, 'cliff', parseInt(e.target.value))}
                                                    min={0}
                                                />
                                                <span className="text-xs text-gray-500">Period before tokens start vesting</span>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm text-black font-medium block">Vesting Duration (days)</label>
                                                <Input
                                                    type="number"
                                                    value={allocation.vesting?.duration || 0}
                                                    onChange={(e) => updateVestingField(index, 'duration', parseInt(e.target.value))}
                                                    min={0}
                                                />
                                                <span className="text-xs text-gray-500">Total duration of the vesting period</span>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-sm text-black font-medium block">Vesting Interval (days)</label>
                                                <Input
                                                    type="number"
                                                    value={allocation.vesting?.interval || 0}
                                                    onChange={(e) => updateVestingField(index, 'interval', parseInt(e.target.value))}
                                                    min={0}
                                                />
                                                <span className="text-xs text-gray-500">How often tokens are released</span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-md p-3 flex items-center gap-2 mt-2">
                                            <span className="text-gray-700 text-sm font-medium">Vesting Summary</span>
                                            <span className="text-xs text-gray-500">No tokens released for {allocation.vesting?.cliff || 0} days, then linear release over {allocation.vesting?.duration || 0} days.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};