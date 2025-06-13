import { useState, useEffect } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Rocket, Wallet2, ExternalLink, SquareArrowOutUpRight, LockKeyhole, TrendingUp } from 'lucide-react';
import { useDeployStore } from '../../../stores/deployStores';
import { ChevronDown, ChevronUp, CircleCheck } from 'lucide-react';
import { SliderCustom } from '../../ui/slider-custom';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { DexOption, DexListing, LiquiditySourceData, WalletLiquidity, SaleLiquidity, BondingLiquidity, TeamLiquidity, ExternalLiquidity, HybridLiquidity } from '../../../types';

export const DEXListing = () => {
    const { dexListing, updateDexListing, validationErrors } = useDeployStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const dexOptions: DexOption[] = [
        { name: 'PumpSwap', status: 'trending', icon: '/icons/pumpdotfun.png', value: 'pumpdotfun' },
        { name: 'Raydium', status: 'popular', icon: '/icons/raydium.png', value: 'raydium' },
        { name: 'Meteora', status: 'popular', icon: 'https://www.meteora.ag/icons/logo.svg', value: 'meteora' }
    ];

    const getStatusColor = (status: DexOption['status']) => {
        switch (status) {
            case 'trending':
                return 'bg-emerald-50 text-semibold text-green-600';
            case 'popular':
                return 'bg-blue-50 text-semibold text-blue-600';
            case 'new':
                return 'bg-purple-50 text-semibold text-purple-600';
            default:
                return 'bg-gray-50 text-semibold text-gray-600';
        }
    };

    const updateLiquidityField = (field: keyof DexListing, value: any) => {
        if (field === 'liquiditySource') {
            // Reset liquidity data when source changes
            let newLiquidityData: LiquiditySourceData;
            switch (value) {
                case 'wallet':
                    newLiquidityData = { type: 'wallet', solAmount: 0 };
                    break;
                case 'sale':
                    newLiquidityData = { type: 'sale', percentage: 0 };
                    break;
                case 'bonding':
                    newLiquidityData = { type: 'bonding', percentage: 0 };
                    break;
                case 'team':
                    newLiquidityData = { type: 'team', percentage: 0, solContribution: 0 };
                    break;
                case 'external':
                    newLiquidityData = { type: 'external', solContribution: 0, tokenAllocation: 0 };
                    break;
                case 'hybrid':
                    newLiquidityData = { 
                        type: 'hybrid', 
                        sources: {
                            wallet: false,
                            sale: false,
                            bonding: false,
                            team: false
                        }
                    };
                    break;
                default:
                    newLiquidityData = { type: 'wallet', solAmount: 0 };
            }
            updateDexListing({ 
                liquiditySource: value,
                liquidityData: newLiquidityData
            });
        } else {
            updateDexListing({ [field]: value });
        }
    };

    const updateLiquidityDataField = (field: string, value: any) => {
        const currentData = dexListing.liquidityData;
        let newData: LiquiditySourceData;

        switch (dexListing.liquiditySource) {
            case 'wallet':
                newData = { ...currentData as WalletLiquidity, [field]: value };
                break;
            case 'sale':
                newData = { ...currentData as SaleLiquidity, [field]: value };
                break;
            case 'bonding':
                newData = { ...currentData as BondingLiquidity, [field]: value };
                break;
            case 'team':
                newData = { ...currentData as TeamLiquidity, [field]: value };
                break;
            case 'external':
                newData = { ...currentData as ExternalLiquidity, [field]: value };
                break;
            case 'hybrid':
                newData = { 
                    ...currentData as HybridLiquidity,
                    sources: {
                        ...(currentData as HybridLiquidity).sources,
                        [field]: value
                    }
                };
                break;
            default:
                newData = currentData;
        }

        updateDexListing({ liquidityData: newData });
    };

    // Validate on mount and when relevant fields change
    useEffect(() => {
        const store = useDeployStore.getState();
        store.validateDexListing();
    }, [dexListing]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className='flex flex-col gap-1'>
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>DEX Listing Setup</div>
                    {
                        isExpanded && (
                            <div className="text-sm text-gray-500 mb-4">Plan how tokens are unlocked overtime</div>
                        )
                    }
                </div>
                {Object.keys(validationErrors).length === 0 ? (
                    <CircleCheck className="w-5 h-5 text-green-500" />
                ) : isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <div className="w-full space-y-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-sm font-semibold">Launch Liquidity On</h1>
                            <div className="relative">
                                <div 
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                                <img src={dexListing.launchLiquidityOn.icon} alt={dexListing.launchLiquidityOn.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <span className="text-gray-900">{dexListing.launchLiquidityOn.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(dexListing.launchLiquidityOn.status)}`}>
                                            {dexListing.launchLiquidityOn.status.charAt(0).toUpperCase() + dexListing.launchLiquidityOn.status.slice(1)}
                                        </span>
                                    </div>
                                    <button className={`text-gray-400 hover:text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                {isDropdownOpen && (
                                    <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                        {dexOptions.map((dex) => (
                                            <div
                                                key={dex.name}
                                                className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${
                                                    dexListing.launchLiquidityOn.name === dex.name ? 'bg-gray-50' : ''
                                                }`}
                                                onClick={() => {
                                                    updateLiquidityField('launchLiquidityOn', dex);
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 flex items-center justify-center">
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                                            <img src={dex.icon} alt={dex.name} className="w-full h-full object-cover" />
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-900">{dex.name}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(dex.status)}`}>
                                                        {dex.status.charAt(0).toUpperCase() + dex.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">The decentralized exchange where your token's liquidity will be launched after the bonding curve target is reached.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-base font-semibold">Liquidity Source</h2>
                                <span className="text-sm text-gray-500">Select where the initial liquidity will come from</span>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'wallet')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'wallet' ? 'bg-blue-50 pb-3 border-b rounded-t-xl border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'wallet' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                <Wallet2 className={`w-6 h-6 ${dexListing.liquiditySource === 'wallet' ? 'text-blue-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${dexListing.liquiditySource === 'wallet' ? 'text-blue-500' : 'text-gray-900'}`}>Your Wallet</div>
                                                <div className="text-xs text-gray-500">You'll provide both SOL and tokens from your wallet</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dexListing.liquiditySource === 'wallet' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'wallet' && (
                                            <div className="px-2 pb-3 pt-2">
                                                <div className="text-sm font-medium mb-1">Wallet Liquidity Amount (SOL)</div>
                                                <Input
                                                    type="number"
                                                    className={`w-full border ${validationErrors.walletLiquidityAmount ? 'border-red-500' : 'border-gray-200'} rounded-md p-2 mb-1`}
                                                    placeholder="10"
                                                    value={(dexListing.liquidityData as WalletLiquidity).solAmount || ''}
                                                    onChange={e => updateLiquidityDataField('solAmount', parseFloat(e.target.value) || 0)}
                                                />
                                                {validationErrors.walletLiquidityAmount && (
                                                    <span className="text-xs text-red-500">{validationErrors.walletLiquidityAmount}</span>
                                                )}
                                                <div className="text-xs text-gray-500">Amount of SOL you'll provide for initial liquidity</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'sale')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'sale' ? 'bg-green-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'sale' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <Rocket className={`w-6 h-6 ${dexListing.liquiditySource === 'sale' ? 'text-green-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${dexListing.liquiditySource === 'sale' ? 'text-green-500' : 'text-gray-900'}`}>Token Sale Proceeds</div>
                                                <div className="text-xs text-gray-500">Use a portion of the funds raised during the token sale</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 ${dexListing.liquiditySource === 'sale' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'sale' && (
                                            <div className="px-2 pb-3 pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h1 className='text-sm font-medium'>Percentage of Sale Proceeds: <span className="font-bold">{(dexListing.liquidityData as SaleLiquidity).percentage}%</span></h1>
                                                </div>
                                                <SliderCustom
                                                    min={0}
                                                    max={100}
                                                    value={[(dexListing.liquidityData as SaleLiquidity).percentage || 0]}
                                                    onValueChange={([val]) => updateLiquidityDataField('percentage', val)}
                                                    className="w-full"
                                                />
                                                <span className="text-xs text-gray-500">Percentage of the token sale proceeds that will be used for liquidity</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'bonding')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'bonding' ? 'bg-purple-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'bonding' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                <TrendingUp className={`w-6 h-6 ${dexListing.liquiditySource === 'bonding' ? 'text-purple-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className='flex flex-row gap-2'>
                                                    <div className={`font-medium text-sm ${dexListing.liquiditySource === 'bonding' ? 'text-purple-500' : 'text-gray-900'}`}>Bonding Curve Reserves</div>
                                                    {
                                                        dexListing.liquiditySource === 'bonding' && (
                                                            <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded-xl bg-purple-100 text-purple-500`}>Recommended</Badge>
                                                        )
                                                    }
                                                </div>
                                                <div className="text-xs text-gray-500">Use a portion of the reserves collected through the bonding curve</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 ${dexListing.liquiditySource === 'bonding' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'bonding' && (
                                            <div className="px-2 pb-3 pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h1 className='text-sm font-medium'>Percentage of Bonding Curve: <span className="font-bold">{(dexListing.liquidityData as BondingLiquidity).percentage}%</span></h1>
                                                </div>
                                                <SliderCustom
                                                    min={0}
                                                    max={100}
                                                    value={[(dexListing.liquidityData as BondingLiquidity).percentage || 0]}
                                                    onValueChange={([val]) => updateLiquidityDataField('percentage', val)}
                                                    className="w-full"
                                                />
                                                <span className="text-xs text-gray-500">Percentage of the bonding curve reserves that will be used for liquidity</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'team')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'team' ? 'bg-orange-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'team' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                                <LockKeyhole className={`w-6 h-6 ${dexListing.liquiditySource === 'team' ? 'text-orange-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${dexListing.liquiditySource === 'team' ? 'text-orange-500' : 'text-gray-900'}`}>Team Reserves</div>
                                                <div className="text-xs text-gray-500">Allocate a portion of the team's token allocation for liquidity.</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 ${dexListing.liquiditySource === 'team' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'team' && (
                                            <div className="px-2 pb-3 pt-2 space-y-2">
                                                <div className='space-y-1'>
                                                    <h1 className='text-sm font-medium'>Team SOL Contribution</h1>
                                                    <Input
                                                        type="number"
                                                        className={`w-full border ${validationErrors.teamSolContribution ? 'border-red-500' : 'border-gray-200'} rounded-md p-2`}
                                                        placeholder="5"
                                                        value={(dexListing.liquidityData as TeamLiquidity).solContribution || ''}
                                                        onChange={e => updateLiquidityDataField('solContribution', parseFloat(e.target.value) || 0)}
                                                    />
                                                    {validationErrors.teamSolContribution && (
                                                        <span className="text-xs text-red-500">{validationErrors.teamSolContribution}</span>
                                                    )}
                                                    <span className='text-xs text-gray-500'>Amount of SOL the team will provide for the liquidity pool</span>
                                                </div>
                                                <div className='space-y-1'>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h1 className='text-sm font-semibold'>Team Token Allocation: <span className="font-bold">{(dexListing.liquidityData as TeamLiquidity).percentage}%</span></h1>
                                                    </div>
                                                    <SliderCustom
                                                        min={0}
                                                        max={100}
                                                        value={[(dexListing.liquidityData as TeamLiquidity).percentage || 0]}
                                                        onValueChange={([val]) => updateLiquidityDataField('percentage', val)}
                                                        className="w-full"
                                                    />
                                                    {validationErrors.teamPercentage && (
                                                        <span className="text-xs text-red-500">{validationErrors.teamPercentage}</span>
                                                    )}
                                                    <span className="text-xs text-gray-500">Percentage of team's token allocation that will be used for liquidity</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'external')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'external' ? 'bg-cyan-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'external' ? 'bg-cyan-100' : 'bg-gray-100'}`}>
                                                <ExternalLink className={`w-6 h-6 ${dexListing.liquiditySource === 'external' ? 'text-cyan-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${dexListing.liquiditySource === 'external' ? 'text-cyan-500' : 'text-gray-900'}`}>External Sources</div>
                                                <div className="text-xs text-gray-500">Use funds from external investors or partners.</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 ${dexListing.liquiditySource === 'external' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'external' && (
                                            <div className="px-2 pb-3 pt-2 space-y-2">
                                                <div className='space-y-1'>
                                                    <h1 className='text-sm font-medium'>External SOL Contribution</h1>
                                                    <Input
                                                        type="number"
                                                        className={`w-full border ${validationErrors.externalSolContribution ? 'border-red-500' : 'border-gray-200'} rounded-md p-2`}
                                                        placeholder="5"
                                                        value={(dexListing.liquidityData as ExternalLiquidity).solContribution || ''}
                                                        onChange={e => updateLiquidityDataField('solContribution', parseFloat(e.target.value) || 0)}
                                                    />
                                                    {validationErrors.externalSolContribution && (
                                                        <span className="text-xs text-red-500">{validationErrors.externalSolContribution}</span>
                                                    )}
                                                    <span className='text-xs text-gray-500'>Amount of SOL the team will provide for the liquidity pool</span>
                                                </div>
                                                <div className='space-y-1'>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h1 className='text-sm font-semibold'>Token Allocation: <span className="font-bold">{(dexListing.liquidityData as ExternalLiquidity).tokenAllocation}%</span></h1>
                                                    </div>
                                                    <SliderCustom
                                                        min={0}
                                                        max={100}
                                                        value={[(dexListing.liquidityData as ExternalLiquidity).tokenAllocation || 0]}
                                                        onValueChange={([val]) => updateLiquidityDataField('tokenAllocation', val)}
                                                        className="w-full"
                                                    />
                                                    {validationErrors.tokenAllocation && (
                                                        <span className="text-xs text-red-500">{validationErrors.tokenAllocation}</span>
                                                    )}
                                                    <span className="text-xs text-gray-500">Percentage of total token supply allocated to external liquidity providers</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`rounded-xl border transition-all cursor-pointer`}
                                        onClick={() => updateLiquidityField('liquiditySource', 'hybrid')}>
                                        <div className={`flex items-center gap-3 p-2 ${dexListing.liquiditySource === 'hybrid' ? 'bg-purple-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                            <div className={`rounded-full p-2 ${dexListing.liquiditySource === 'hybrid' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                <SquareArrowOutUpRight className={`w-6 h-6 ${dexListing.liquiditySource === 'hybrid' ? 'text-purple-500' : 'text-gray-500'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${dexListing.liquiditySource === 'hybrid' ? 'text-purple-500' : 'text-gray-900'}`}>Hybrid (Multiple Sources)</div>
                                                <div className="text-xs text-gray-500">Combine multiple sources for deeper initial liquidity.</div>
                                            </div>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 ${dexListing.liquiditySource === 'hybrid' ? 'rotate-180' : ''}`} />
                                        </div>
                                        {dexListing.liquiditySource === 'hybrid' && (
                                            <div className="px-2 pb-3 pt-2 space-y-2">
                                                <h1 className='text-sm font-medium'>Select Sources to combine: </h1>
                                                <div className='flex flex-col gap-3'>
                                                    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                        <Checkbox 
                                                            id="wallet" 
                                                            checked={(dexListing.liquidityData as HybridLiquidity).sources.wallet}
                                                            onCheckedChange={(checked) => updateLiquidityDataField('sources', {
                                                                ...(dexListing.liquidityData as HybridLiquidity).sources,
                                                                wallet: checked as boolean
                                                            })}
                                                        />
                                                        <Label htmlFor="wallet" className='text-xs font-normal'>Your Wallet</Label>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                        <Checkbox 
                                                            id="sale" 
                                                            checked={(dexListing.liquidityData as HybridLiquidity).sources.sale}
                                                            onCheckedChange={(checked) => updateLiquidityDataField('sources', {
                                                                ...(dexListing.liquidityData as HybridLiquidity).sources,
                                                                sale: checked as boolean
                                                            })}
                                                        />
                                                        <Label htmlFor="sale" className='text-xs font-normal'>Token Sale Proceeds</Label>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                        <Checkbox 
                                                            id="bonding" 
                                                            checked={(dexListing.liquidityData as HybridLiquidity).sources.bonding}
                                                            onCheckedChange={(checked) => updateLiquidityDataField('sources', {
                                                                ...(dexListing.liquidityData as HybridLiquidity).sources,
                                                                bonding: checked as boolean
                                                            })}
                                                        />
                                                        <Label htmlFor="bonding" className='text-xs font-normal'>Bonding Curve Reserves</Label>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                        <Checkbox 
                                                            id="team" 
                                                            checked={(dexListing.liquidityData as HybridLiquidity).sources.team}
                                                            onCheckedChange={(checked) => updateLiquidityDataField('sources', {
                                                                ...(dexListing.liquidityData as HybridLiquidity).sources,
                                                                team: checked as boolean
                                                            })}
                                                        />
                                                        <Label htmlFor="team" className='text-xs font-normal'>Team Reserves</Label>
                                                    </div>
                                                </div>
                                                {validationErrors.hybridSources && (
                                                    <span className="text-xs text-red-500">{validationErrors.hybridSources}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="text-base font-semibold mb-2">Liquidity Type</div>
                                <div className="relative">
                                    <select
                                        className={`w-full text-sm border ${validationErrors.liquidityType ? 'border-red-500' : 'border-gray-200'} rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200`}
                                        value={dexListing.liquidityType || ''}
                                        onChange={e => updateLiquidityField('liquidityType', e.target.value as 'double' | 'single')}
                                    >
                                        <option value="double">Double-Sided Liquidity</option>
                                        <option value="single">Single-Sided Liquidity</option>
                                    </select>
                                    {validationErrors.liquidityType && (
                                        <span className="text-xs text-red-500 mt-1">{validationErrors.liquidityType}</span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Double-Sided: Traditional liquidity pool requiring both your token and SOL
                                </div>
                            </div>
                        </div>

                        <div className='flex flex-col gap-1'>
                            <div className="flex items-center justify-between">
                                <h1 className='text-base font-semibold'>Liquidity Percentage: <span className="font-bold">{dexListing.liquidityPercentage}%</span></h1>
                            </div>
                            <SliderCustom
                                min={0}
                                max={100}
                                value={[dexListing.liquidityPercentage || 0]}
                                onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                className="w-full"
                            />
                            {validationErrors.liquidityPercentage && (
                                <span className="text-xs text-red-500">{validationErrors.liquidityPercentage}</span>
                            )}
                            <span className='text-xs text-gray-500'>Percentage of the token sale proceeds that will be used for liquidity</span>
                        </div>

                        <div className='space-y-2'>
                            <h1 className='text-base font-semibold'>Liquidity Lookup Period (days)</h1>
                            <Input 
                                className={`w-full border ${validationErrors.liquidityLockupPeriod ? 'border-red-500' : 'border-gray-200'} rounded-md p-2`} 
                                placeholder='30' 
                                type="number"
                                min="30"
                                value={dexListing.liquidityLockupPeriod} 
                                onChange={e => updateLiquidityField('liquidityLockupPeriod', parseInt(e.target.value) || 0)}
                            />
                            {validationErrors.liquidityLockupPeriod && (
                                <span className="text-xs text-red-500">{validationErrors.liquidityLockupPeriod}</span>
                            )}
                            <span className='text-sm text-gray-500'>Period during which the initial liquidity cannot be removed (minimum 30 days)</span>
                        </div>

                        {dexListing.liquiditySource === 'wallet' && (
                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>Wallet Liquidity Amount (SOL)</h1>
                                <Input 
                                    className={`w-full border ${validationErrors.walletLiquidityAmount ? 'border-red-500' : 'border-gray-200'} rounded-md p-2`} 
                                    type="number"
                                    placeholder='10' 
                                    value={(dexListing.liquidityData as WalletLiquidity).solAmount || ''} 
                                    onChange={e => updateLiquidityDataField('solAmount', parseFloat(e.target.value) || 0)}
                                />
                                <div className='flex flex-col gap-1'>
                                    {validationErrors.walletLiquidityAmount && (
                                        <span className="text-xs text-red-500">{validationErrors.walletLiquidityAmount}</span>
                                    )}
                                    <span className='text-sm text-gray-500'>Amount of SOL you'll provide for initial liquidity</span>
                                </div>
                            </div>
                        )}

                        {dexListing.liquiditySource === 'external' && (
                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>External SOL Contribution</h1>
                                <Input 
                                    className={`w-full border ${validationErrors.externalSolContribution ? 'border-red-500' : 'border-gray-200'} rounded-md p-2`} 
                                    type="number"
                                    placeholder='5' 
                                    value={(dexListing.liquidityData as ExternalLiquidity).solContribution || ''} 
                                    onChange={e => updateLiquidityDataField('solContribution', parseFloat(e.target.value) || 0)}
                                />
                                {validationErrors.externalSolContribution && (
                                    <span className="text-xs text-red-500">{validationErrors.externalSolContribution}</span>
                                )}
                                <span className='text-sm text-gray-500'>Amount of SOL the team will provide for the liquidity pool</span>
                            </div>
                        )}

                        <div className='border border-gray-200 rounded-lg p-3 bg-gray-100'>
                            <div className='flex flex-row justify-between items-center'>
                                <div className='flex flex-row gap-2 items-center'>
                                    <h1 className='text-sm font-medium'>Anti-Bot Protection</h1>
                                    <IconInfoCircle className='w-5 h-5' />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => updateLiquidityField('isAutoBotProtectionEnabled', !dexListing.isAutoBotProtectionEnabled)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${dexListing.isAutoBotProtectionEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${dexListing.isAutoBotProtectionEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        {
                            dexListing.isAutoBotProtectionEnabled && (
                                <div className="space-y-4">
                                    <div className='space-y-1'>
                                        <h2 className="text-base font-semibold">Post-Launch Strategy</h2>
                                        <p className="text-xs text-gray-500">Configure what happens after your token is launched on the DEX</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2 border-2 border-dashed border-gray-300 rounded-lg p-5">
                                            <div className='flex flex-row gap-2 justify-between items-center'>
                                                <div className='flex flex-row gap-2 items-center'>
                                                    <Rocket className='w-4 h-4' />
                                                    <div className="font-medium">Auto-Listing</div>
                                                </div>
                                                <button
                                                    onClick={() => updateLiquidityField('isAutoListingEnabled', !dexListing.isAutoListingEnabled)}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                        dexListing.isAutoListingEnabled ? 'bg-black' : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                        dexListing.isAutoListingEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-500">Automatically list your token on popular aggregators like Jupiter after launch</div>
                                        </div>

                                        <div className="flex flex-col gap-2 border-2 border-dashed border-gray-300 rounded-lg p-5">
                                            <div className='flex flex-row gap-2 justify-between items-center'>
                                                <div className="flex flex-row gap-2 items-center">
                                                    <LockKeyhole className='w-4 h-4' />
                                                    <div className="font-medium">Price Protection</div>
                                                </div>
                                                <button
                                                    onClick={() => updateLiquidityField('isPriceProtectionEnabled', !dexListing.isPriceProtectionEnabled)}
                                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                        dexListing.isPriceProtectionEnabled ? 'bg-black' : 'bg-gray-200'
                                                    }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                        dexListing.isPriceProtectionEnabled ? 'translate-x-6' : 'translate-x-1'
                                                    }`} />
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-500">Implement mechanisms to reduce price volatility during the first 24 hours after DEX launch.</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            )}
        </div>
    );
};
