import { useState } from 'react';
import { IconArrowLeft, IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { Rocket, Wallet2, ExternalLink, SquareArrowOutUpRight, LockKeyhole, TrendingUp } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';

interface DexOption {
    name: string;
    status: 'trending' | 'popular' | 'new';
    icon: string;
}

interface LiquidityProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const Liquidity = ({ setCurrentStep, currentStep }: LiquidityProps) => {
    const { state, updateLiquidityField, setStepEnabled } = useTokenDeployer();
    const { enabled, data } = state.liquidity;
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

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
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-lg font-bold">Liquidity Configuration</h1>
                        <p className="text-xs text-gray-500">Configure how your token will be launched on a DEX once the bonding curve target is reached </p>
                    </div>
                </div>
                <button
                    onClick={() => setStepEnabled('liquidity', !enabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${enabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>

            {
                enabled && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-lg font-bold">Launch Liquidity On</h1>
                            <div className="relative">
                                <div 
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 cursor-pointer"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center">
                                                <img src={data.selectedDex.icon} alt={data.selectedDex.name} className="w-full h-full object-cover" />
                                            </div>
                                        </div>
                                        <span className="text-gray-900">{data.selectedDex.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(data.selectedDex.status)}`}>
                                            {data.selectedDex.status.charAt(0).toUpperCase() + data.selectedDex.status.slice(1)}
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
                                                    data.selectedDex.name === dex.name ? 'bg-gray-50' : ''
                                                }`}
                                                onClick={() => {
                                                    updateLiquidityField('selectedDex', dex);
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
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold">Liquidity Type</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-4 cursor-pointer p-3 border border-gray-200 rounded-lg">
                                    <input
                                        type="radio"
                                        name="liquidityType"
                                        checked={data.liquidityType === 'double'}
                                        onChange={() => updateLiquidityField('liquidityType', 'double')}
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <div className="font-medium">Double-Sided Liquidity</div>
                                        <div className="text-sm text-gray-500">Traditional liquidity pool pairing both your token and SOL</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-4 cursor-pointer p-2 border border-gray-200 rounded-lg">
                                    <input
                                        type="radio"
                                        name="liquidityType"
                                        checked={data.liquidityType === 'single'}
                                        onChange={() => updateLiquidityField('liquidityType', 'single')}
                                        className="mt-1 h-4 w-4"
                                    />
                                    <div>
                                        <div className="font-medium">Single-Sided Liquidity</div>
                                        <div className="text-sm text-gray-500">Provide only your token to the pool, SOL comes from the token launch</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {
                            data.liquidityType === 'single' && (
                                <div className='border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2'>
                                    <h1 className='text-base font-semibold'>Your Token Allocation for Liquidity Pool (%)</h1>
                                    <input 
                                        type="text" 
                                        className='w-full border border-gray-200 rounded-md p-2' 
                                        placeholder='20%'
                                        value={data.liquidityPercentage}
                                        onChange={(e) => updateLiquidityField('liquidityPercentage', parseInt(e.target.value) || 0)}
                                    />
                                    <span className='text-xs text-gray-500'>For single-sided liquidity only: Percentage of your total token supply that will be allocated to the liquidity pool.</span>
                                </div>
                            )
                        }

                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold">Liquidity Source</h2>
                                <span className="text-xs text-gray-500">Select where the initial liquidity will come from</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => updateLiquidityField('liquiditySource', 'bonding')}
                                    className={`p-4 border rounded-lg text-center space-y-4 ${
                                        data.liquiditySource === 'bonding' ? 'border-black bg-gray-50' : 'border-gray-200'
                                    }`}
                                >
                                    <Rocket className="mx-auto h-8 w-8" />
                                    <div className='space-y-1'>
                                        <div className="font-medium">Bonding Curve</div>
                                        <div className="text-xs text-gray-500">Using funds raised from the bonding curve</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateLiquidityField('liquiditySource', 'team')}
                                    className={`p-4 border rounded-lg text-center space-y-4 ${
                                        data.liquiditySource === 'team' ? 'border-black bg-gray-50' : 'border-gray-200'
                                    }`}
                                >
                                    <Wallet2 className="mx-auto h-8 w-8" />
                                    <div className='space-y-1'>
                                        <div className="font-medium">Team Reserves</div>
                                        <div className="text-xs text-gray-500">Use team's own funds</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => updateLiquidityField('liquiditySource', 'external')}
                                    className={`p-4 border rounded-lg text-center space-y-4 ${
                                        data.liquiditySource === 'external' ? 'border-black bg-gray-50' : 'border-gray-200'
                                    }`}
                                >
                                    <ExternalLink className="mx-auto h-8 w-8" />
                                    <div className='space-y-1'>
                                        <div className="font-medium">External Source</div>
                                        <div className="text-xs text-gray-500">Use external funding</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 py-4'>
                            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                                <div className='space-y-1'>
                                    <h2 className="text-lg font-semibold">DEX Information</h2>
                                    <p className="text-sm text-gray-500">Current statistics for your selected DEX</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="text-sm font-medium">24h Volume:</div>
                                        <div className="font-medium">$42.8M</div>
                                    </div>
                                    <div className="flex flex-row justify-between items-center">
                                        <div className="text-sm font-medium">TVL:</div>
                                        <div className="font-medium">$156.2M</div>
                                    </div>
                                </div>
                                <button 
                                    className="text-sm p-2 border border-gray-200 rounded-md w-full flex flex-row gap-3 justify-center items-center hover:bg-gray-50 transition-colors"
                                    onClick={() => window.open('https://pump.fun', '_blank')}
                                >
                                    <span className='font-medium'>View DEX</span>
                                    <SquareArrowOutUpRight className='w-4 h-4' />
                                </button>
                            </div>

                            <div className="space-y-4 col-span-2">
                                <div className="space-y-1">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <h2 className="text-lg font-semibold">Liquidity Percentage: {data.liquidityPercentage}%</h2>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={data.liquidityPercentage}
                                            onChange={(e) => updateLiquidityField('liquidityPercentage', parseInt(e.target.value))}
                                            className="w-full accent-black cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Percentage of raised funds that will be used to create the initial liquidity pool</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <h2 className="text-lg font-semibold">Liquidity Lockup Period (days)</h2>
                                    </div>
                                    <input
                                        type="text"
                                        value={data.lockupPeriod}
                                        onChange={(e) => updateLiquidityField('lockupPeriod', parseInt(e.target.value) || 0)}
                                        className="w-full border border-gray-200 rounded-md p-2"
                                        placeholder="180"
                                    />
                                    <p className="text-xs text-gray-500">Period during which the initial liquidity cannot be removed (minimum 30 days)</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2">
                                <div className="font-medium">Anti-Bot Protection</div>
                                <IconInfoCircle className="w-4 h-4 cursor-pointer" />
                            </div>
                            <button
                                onClick={() => updateLiquidityField('antiBotProtection', !data.antiBotProtection)}
                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                    data.antiBotProtection ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                    data.antiBotProtection ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className='space-y-1'>
                                <h2 className="text-lg font-semibold">Post-Launch Strategy</h2>
                                <p className="text-xs text-gray-500">Configure what happens after your token is launched on the DEX</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex flex-col gap-2 border-2 border-dashed border-gray-300 rounded-lg p-5">
                                    <div className='flex flex-row gap-2 justify-between items-center'>
                                        <div className='flex flex-row gap-2 items-center'>
                                            <Rocket className='w-4 h-4' />
                                            <div className="font-medium">Auto-Listing</div>
                                        </div>
                                        <button
                                            onClick={() => updateLiquidityField('autoListing', !data.autoListing)}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                data.autoListing ? 'bg-black' : 'bg-gray-200'
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                data.autoListing ? 'translate-x-6' : 'translate-x-1'
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
                                            onClick={() => updateLiquidityField('priceProtection', !data.priceProtection)}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                data.priceProtection ? 'bg-black' : 'bg-gray-200'
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                data.priceProtection ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500">Implement mechanisms to reduce price volatility during the first 24 hours after DEX launch.</div>
                                </div>
                                <div className="flex flex-col gap-2 border-2 border-dashed border-gray-300 rounded-lg p-5">
                                    <div className='flex flex-row gap-2 justify-between items-center'>
                                        <div className="flex flex-row gap-2 items-center">
                                            <TrendingUp className='w-4 h-4' />
                                            <div className="font-medium">Market Making</div>
                                        </div>
                                        <button
                                            onClick={() => updateLiquidityField('marketMaking', !data.marketMaking)}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                data.marketMaking ? 'bg-black' : 'bg-gray-200'
                                            }`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                                                data.marketMaking ? 'translate-x-6' : 'translate-x-1'
                                            }`} />
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500">Enable automated market making to ensure liquidity and reduce slippage (additional fees apply)</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                            <div className="flex items-center gap-2">
                                <IconInfoCircle className="w-5 h-5" />
                                <h2 className="text-lg font-semibold">How Liquidity Works</h2>
                            </div>
                            <p className="text-sm text-gray-600">
                                Your token initially exists only on the bonding curve. Once the target goal is reached, tokens are minted and liquidity is provided to your selected DEX. This allows your token to be traded on the open market.
                            </p>
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

export default Liquidity;