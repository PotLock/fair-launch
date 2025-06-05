import { useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Rocket, Wallet2, ExternalLink, SquareArrowOutUpRight, LockKeyhole, TrendingUp } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SliderCustom } from '../../ui/slider-custom';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';

interface DexOption {
    name: string;
    status: 'trending' | 'popular' | 'new';
    icon: string;
}


export const DEXListing = () => {
    const { state, updateLiquidityField } = useTokenDeployer();
    const { data } = state.liquidity;
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const dexOptions: DexOption[] = [
        { name: 'PumpSwap', status: 'trending', icon: '/icons/pumpdotfun.png' },
        { name: 'Raydium', status: 'popular', icon: '/icons/raydium.png' },
        { name: 'Meteora', status: 'popular', icon: 'https://www.meteora.ag/icons/logo.svg' }
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

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className='flex flex-col gap-1'>
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>DEX Listing Setup</div>
                    {
                        isExpanded && (
                            <div className="text-sm text-gray-500 mb-4">Plan how tokens are unlocked overtime</div>
                        )
                    }
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <div className="mt-4">
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
                                                    <img src={data.launchLiquidityOn.icon} alt={data.launchLiquidityOn.name} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                            <span className="text-gray-900">{data.launchLiquidityOn.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(data.launchLiquidityOn.status)}`}>
                                                {data.launchLiquidityOn.status.charAt(0).toUpperCase() + data.launchLiquidityOn.status.slice(1)}
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
                                                        data.launchLiquidityOn.name === dex.name ? 'bg-gray-50' : ''
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
                                    <h2 className="text-lg font-semibold">Liquidity Source</h2>
                                    <span className="text-xs text-gray-500">Select where the initial liquidity will come from</span>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'wallet')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'wallet' ? 'bg-blue-50 pb-3 border-b rounded-t-xl border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'wallet' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                    <Wallet2 className={`w-6 h-6 ${data.liquiditySource === 'wallet' ? 'text-blue-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-medium text-base ${data.liquiditySource === 'wallet' ? 'text-blue-500' : 'text-gray-900'}`}>Your Wallet</div>
                                                    <div className="text-sm text-gray-500">You'll provide both SOL and tokens from your wallet</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${data.liquiditySource === 'wallet' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'wallet' && (
                                                <div className="px-6 pb-4 pt-2">
                                                    <div className="text-sm font-medium mb-1">Liquidity Type</div>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-200 rounded-md p-2 mb-1"
                                                        placeholder="10"
                                                        value={data.walletLiquidityAmount || ''}
                                                        onChange={e => updateLiquidityField('walletLiquidityAmount', e.target.value)}
                                                    />
                                                    <div className="text-xs text-gray-500">Amount od SOL you'll provide for initial liquidity</div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'sale')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'sale' ? 'bg-green-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'sale' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                    <Rocket className={`w-6 h-6 ${data.liquiditySource === 'sale' ? 'text-green-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-medium text-base ${data.liquiditySource === 'sale' ? 'text-green-500' : 'text-gray-900'}`}>Token Sale Proceeds</div>
                                                    <div className="text-sm text-gray-500">Use a portion of the funds raised during the token sale</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 ${data.liquiditySource === 'sale' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'sale' && (
                                                <div className="px-6 pb-4 pt-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h1 className='text-base font-semibold'>Percentage of Sale Proceeds: <span className="font-bold">{data.liquidityPercentage}%</span></h1>
                                                    </div>
                                                    <SliderCustom
                                                        min={0}
                                                        max={100}
                                                        value={[data.liquidityPercentage || 0]}
                                                        onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                                        className="w-full"
                                                    />
                                                    <span className="text-xs text-gray-500">Percentage of the token sale proceeds that will be used for liquidity</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'bonding')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'bonding' ? 'bg-purple-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'bonding' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                    <TrendingUp className={`w-6 h-6 ${data.liquiditySource === 'bonding' ? 'text-purple-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className='flex flex-row gap-2'>
                                                        <div className={`font-medium text-base ${data.liquiditySource === 'bonding' ? 'text-purple-500' : 'text-gray-900'}`}>Bonding Curve Reserves</div>
                                                        {
                                                            data.liquiditySource === 'bonding' && (
                                                                <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded-xl bg-purple-100 text-purple-500`}>Recommended</Badge>
                                                            )
                                                        }
                                                    </div>
                                                    <div className="text-sm text-gray-500">Use a portion of the reserves collected through the bonding curve</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 ${data.liquiditySource === 'bonding' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'bonding' && (
                                                <div className="px-6 pb-4 pt-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h1 className='text-base font-semibold'>Percentage of Sale Proceeds: <span className="font-bold">{data.liquidityPercentage}%</span></h1>
                                                    </div>
                                                    <SliderCustom
                                                        min={0}
                                                        max={100}
                                                        value={[data.liquidityPercentage || 0]}
                                                        onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                                        className="w-full"
                                                    />
                                                    <span className="text-xs text-gray-500">Percentage of the token sale proceeds that will be used for liquidity</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'team')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'team' ? 'bg-orange-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'team' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                                                    <LockKeyhole className={`w-6 h-6 ${data.liquiditySource === 'team' ? 'text-orange-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-medium text-base ${data.liquiditySource === 'team' ? 'text-orange-500' : 'text-gray-900'}`}>Team Reserves</div>
                                                    <div className="text-sm text-gray-500">Allocate a portion of the team's token allocation for liquidity.</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 ${data.liquiditySource === 'team' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'team' && (
                                                <div className="px-6 pb-4 pt-2 space-y-2">
                                                    <div className='space-y-1'>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h1 className='text-sm font-semibold'>Percentage of Sale Proceeds: <span className="font-bold">{data.liquidityPercentage}%</span></h1>
                                                        </div>
                                                        <SliderCustom
                                                            min={0}
                                                            max={100}
                                                            value={[data.liquidityPercentage || 0]}
                                                            onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                                            className="w-full"
                                                        />
                                                        <span className="text-xs text-gray-500">Percentage of the token sale proceeds that will be used for liquidity</span>
                                                    </div>
                                                    <div className='space-y-1'>
                                                        <h1 className='text-sm font-medium'>Team SOL Contribution</h1>
                                                        <Input
                                                            type="number"
                                                            className="w-full border border-gray-200 rounded-md p-2"
                                                            placeholder="0"
                                                        />
                                                        <span className='text-xs text-gray-500'>Amount of SOL the team will provide for the liquidity pool</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'external')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'external' ? 'bg-cyan-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'external' ? 'bg-cyan-100' : 'bg-gray-100'}`}>
                                                    <ExternalLink className={`w-6 h-6 ${data.liquiditySource === 'external' ? 'text-cyan-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-medium text-base ${data.liquiditySource === 'external' ? 'text-cyan-500' : 'text-gray-900'}`}>External Sources</div>
                                                    <div className="text-sm text-gray-500">Use funds from external investors or partners.</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 ${data.liquiditySource === 'external' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'external' && (
                                                <div className="px-6 pb-4 pt-2 space-y-2">
                                                    <div className='space-y-1'>
                                                        <h1 className='text-sm font-medium'>External SOL Contribution</h1>
                                                        <Input
                                                            type="number"
                                                            className="w-full border border-gray-200 rounded-md p-2"
                                                            placeholder="5"
                                                        />
                                                        <span className='text-xs text-gray-500'>Amount of SOL the team will provide for the liquidity pool</span>
                                                    </div>
                                                    <div className='space-y-1'>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h1 className='text-sm font-semibold'>Token Allocation: <span className="font-bold">{data.liquidityPercentage}%</span></h1>
                                                        </div>
                                                        <SliderCustom
                                                            min={0}
                                                            max={100}
                                                            value={[data.liquidityPercentage || 0]}
                                                            onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                                            className="w-full"
                                                        />
                                                        <span className="text-xs text-gray-500">Percentage of total token supply allocated to external liquidity providers</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`rounded-xl border transition-all cursor-pointer`}
                                            onClick={() => updateLiquidityField('liquiditySource', 'hybrid')}>
                                            <div className={`flex items-center gap-3 p-4 ${data.liquiditySource === 'hybrid' ? 'bg-purple-50 pb-3 rounded-t-xl border-b rounded-none border-gray-200' : 'bg-white border-gray-200 rounded-xl'}`}>
                                                <div className={`rounded-full p-2 ${data.liquiditySource === 'hybrid' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                    <SquareArrowOutUpRight className={`w-6 h-6 ${data.liquiditySource === 'hybrid' ? 'text-purple-500' : 'text-gray-500'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className={`font-medium text-base ${data.liquiditySource === 'hybrid' ? 'text-purple-500' : 'text-gray-900'}`}>Hybrid (Multiple Sources)</div>
                                                    <div className="text-sm text-gray-500">Combine multiple sources for deeper initial liquidity.</div>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-gray-400 ${data.liquiditySource === 'hybrid' ? 'rotate-180' : ''}`} />
                                            </div>
                                            {data.liquiditySource === 'hybrid' && (
                                                <div className="px-6 pb-4 pt-2 space-y-2">
                                                    <h1 className='text-sm font-medium'>Select Sources to combine: </h1>
                                                    <div className='flex flex-col gap-3'>
                                                        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                            <Checkbox id="wallet" />
                                                            <Label htmlFor="wallet" className='text-xs font-normal'>Your Wallet</Label>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                            <Checkbox id="sale" />
                                                            <Label htmlFor="sale" className='text-xs font-normal'>Token Sale Proceeds</Label>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                            <Checkbox id="bonding" />
                                                            <Label htmlFor="bonding" className='text-xs font-normal'>Bonding Curve Reserves</Label>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg">
                                                            <Checkbox id="team" />
                                                            <Label htmlFor="team" className='text-xs font-normal'>Team Reserves</Label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <div className="text-base font-semibold mb-2">Liquidity Type</div>
                                    <div className="relative">
                                        <select
                                            className="w-full border border-gray-200 rounded-lg p-3 text-base bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                            value={data.liquidityType || ''}
                                            onChange={e => updateLiquidityField('liquidityType', e.target.value as 'double' | 'single')}
                                        >
                                            <option value="double">Double-Sided Liquidity</option>
                                            <option value="single">Single-Sided Liquidity</option>
                                        </select>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Double-Sided: Traditional liquidity pool requiring both your token and SOL
                                    </div>
                                </div>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <div className="flex items-center justify-between">
                                    <h1 className='text-base font-semibold'>Liquidity Percentage: <span className="font-bold">{data.liquidityPercentage}%</span></h1>
                                </div>
                                <SliderCustom
                                    min={0}
                                    max={100}
                                    value={[data.liquidityPercentage || 0]}
                                    onValueChange={([val]) => updateLiquidityField('liquidityPercentage', val)}
                                    className="w-full"
                                />
                                <span className='text-base text-gray-500'>Percentage of the token sale proceeds that will be used for liquidity</span>
                            </div>

                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>Liquidity Lookup Period (days)</h1>
                                <Input className='w-full border border-gray-200 rounded-md p-2' placeholder='10'/>
                                <span className='text-sm text-gray-500'>Period during which the initial liquidity cannot be removed (minimum 30n days)</span>
                            </div>
                            
                            <div className='border border-gray-200 rounded-lg p-3 bg-gray-100'>
                                <div className='flex flex-row justify-between items-center'>
                                    <div className='flex flex-row gap-2 items-center'>
                                        <h1 className='text-sm font-medium'>Anti-Bot Protection</h1>
                                        <IconInfoCircle className='w-5 h-5' />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateLiquidityField('isAutoBotProtectionEnabled', !data.isAutoBotProtectionEnabled)}
                                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${data.isAutoBotProtectionEnabled ? 'bg-black' : 'bg-gray-200'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${data.isAutoBotProtectionEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className='space-y-1'>
                                    <h2 className="text-lg font-semibold">Post-Launch Strategy</h2>
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
                                                onClick={() => updateLiquidityField('isAutoListingEnabled', !data.isAutoListingEnabled)}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                    data.isAutoListingEnabled ? 'bg-black' : 'bg-gray-200'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                    data.isAutoListingEnabled ? 'translate-x-6' : 'translate-x-1'
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
                                                onClick={() => updateLiquidityField('isPriceProtectionEnabled', !data.isPriceProtectionEnabled)}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                    data.isPriceProtectionEnabled ? 'bg-black' : 'bg-gray-200'
                                                }`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                    data.isPriceProtectionEnabled ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500">Implement mechanisms to reduce price volatility during the first 24 hours after DEX launch.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
