import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDeployStore } from '../../../stores/deployStores';
import { Input } from '../../ui/input';
import { TokenDistributionItem } from '../../../types';
import { ChartNoAxesCombined } from 'lucide-react';

export const TokenDistribution = () => {
    const { allocation, addAllocation, removeAllocation, updateAllocationItem, updateVestingItem } = useDeployStore();
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    
    const handleAddAllocation = (e: React.MouseEvent) => {
        e.stopPropagation();
        addAllocation();
    };

    const handleRemoveAllocation = (index: number) => {
        removeAllocation(index);
    };

    const handleAllocationChange = (index: number, field: keyof TokenDistributionItem, value: any) => {
        updateAllocationItem(index, field, value);
    };

    const handleVestingChange = (index: number, field: keyof TokenDistributionItem['vesting'], value: any) => {
        updateVestingItem(index, field, value);
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
                <div className="flex items-start gap-2">
                    {
                        isExpanded && (
                            <button
                                className="px-4 py-2 border border-gray-300 rounded-xl flex text-sm items-center gap-2 hover:bg-gray-50"
                                onClick={handleAddAllocation}
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
                    {allocation.map((item, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-semibold">Allocation #{index + 1}</h3>
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
                                        value={item.description}
                                        onChange={(e) => handleAllocationChange(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <div className="flex flex-col">
                                        <label htmlFor="percentage" className="text-sm text-black font-medium mt-1 block">
                                            Percentage: {item.percentage}%
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({Math.round((item.percentage / 100) * Number(useDeployStore.getState().basicInfo.supply)).toLocaleString()} tokens)
                                            </span>
                                        </label>
                                        <div className="flex-1">
                                            <input
                                                type="range"
                                                value={item.percentage}
                                                onChange={(e) => handleAllocationChange(index, 'percentage', Number(e.target.value))}
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
                                        value={item.walletAddress}
                                        onChange={(e) => handleAllocationChange(index, 'walletAddress', e.target.value)}
                                    />
                                </div>
                                
                                <div className='space-y-2 border border-gray-200 rounded-lg'>
                                    <div className={`flex items-center gap-2 justify-between p-2 bg-gray-50  ${item.vesting.enabled ? 'border-b border-gray-200 rounded-t-lg' : 'rounded-lg'}`}>
                                        <label className="text-sm font-medium">Vesting Schedule</label>
                                        <button
                                            type="button"
                                            onClick={() => handleVestingChange(index, 'enabled', !item.vesting.enabled)}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${item.vesting.enabled ? 'bg-black' : 'bg-gray-200'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${item.vesting.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                    </div>
                                    
                                    {item.vesting.enabled && (
                                        <div className="space-y-4 p-2">
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-black font-medium block">Description (Optional)</label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g Team"
                                                        value={item.vesting.description || ''}
                                                        onChange={(e) => handleVestingChange(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-black font-medium block">Percentage: {item.vesting.percentage || 0}%</label>
                                                    <input
                                                        type="range"
                                                        value={item.vesting.percentage || 0}
                                                        onChange={(e) => handleVestingChange(index, 'percentage', Number(e.target.value))}
                                                        max={100}
                                                        step={1}
                                                        className="w-full h-3 bg-gray-200 rounded-lg cursor-pointer accent-black"
                                                    />
                                                    <span className="text-xs text-gray-500 mt-1 block">Percentage of Total Supply</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-black font-medium block">Cliff Period (days)</label>
                                                    <div className='flex flex-col items-center gap-1'>
                                                        <Input
                                                            type="number"
                                                            value={item.vesting.cliff || 0}
                                                            onChange={(e) => handleVestingChange(index, 'cliff', Number(e.target.value))}
                                                            min={0}
                                                        />
                                                        <span className="text-[11px] text-gray-500">Period before tokens start vesting</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-black font-medium block">Vesting Duration (days)</label>
                                                    <div className='flex flex-col items-center gap-1'>
                                                        <Input
                                                            type="number"
                                                            value={item.vesting.duration || 0}
                                                            onChange={(e) => handleVestingChange(index, 'duration', Number(e.target.value))}
                                                            min={0}
                                                        />
                                                        <span className="text-[11px] text-gray-500">Total duration of the vesting period</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-black font-medium block">Vesting Interval (days)</label>
                                                    <div className='flex flex-col items-center gap-1'>
                                                        <Input
                                                            type="number"
                                                            value={item.vesting.interval || 0}
                                                            onChange={(e) => handleVestingChange(index, 'interval', Number(e.target.value))}
                                                            min={0}
                                                        />
                                                        <span className="text-[11px] text-gray-500">How often tokens are released</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 rounded-md p-3 flex items-start gap-2 mt-2">
                                                <ChartNoAxesCombined className='w-7 h-7' />
                                                <div className='flex flex-col'>
                                                    <span className="text-gray-700 text-sm font-medium">Vesting Summary</span>
                                                    <span className="text-xs text-gray-500">No tokens released for {allocation[index].vesting.cliff || 0} days, then linear release over {allocation[index].vesting.duration || 0} days.</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};