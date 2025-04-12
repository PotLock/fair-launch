import { IconArrowLeft, IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';

interface ReviewAndDeployProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const ReviewAndDeploy = ({ setCurrentStep, currentStep }: ReviewAndDeployProps) => {
    const { state } = useTokenDeployer();
    const [openSections, setOpenSections] = useState({
        tokenDetails: true,
        tokenAllocation: false,
        vestingSchedule: false,
        bondingCurve: false,
        fees: false,
        launchpad: false,
        liquidity: false
    });

    const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className='space-y-6'>
            <div className='space-y-1 border-b border-gray-200 pb-4'>
                <h1 className='text-lg font-bold'>Review and Deploy</h1>
                <p className='text-sm text-gray-500'>Review your token configuration before deployment. Once deployed, some parameters cannot be changed</p>
            </div>
            <div className='space-y-4'>
                {/* Token Header */}
                <div className='flex items-center gap-4 bg-gray-50 p-4 rounded-lg'>
                    <div className='w-16 h-16 rounded-lg'>
                        {state.basicInfo.data.logo && (
                            <img 
                                src={URL.createObjectURL(state.basicInfo.data.logo)} 
                                alt="Token Logo" 
                                className="w-full h-full object-cover rounded-lg"
                            />
                        )}
                    </div>
                    <div>
                        <h2 className='font-bold'>{state.basicInfo.data.name || 'Token Name'}</h2>
                        <p className='text-sm text-gray-600'>${state.basicInfo.data.symbol} • {state.basicInfo.data.supply} Tokens</p>
                    </div>
                </div>

                <div className='divide-y'>
                    {/* Token Details */}
                    <div className='py-4'>
                        <button 
                            className='w-full flex justify-between items-center'
                            onClick={() => toggleSection('tokenDetails')}
                        >
                            <span className='font-semibold'>Token Details</span>
                            <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.tokenDetails ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.tokenDetails && (
                            <div className='mt-4 space-y-4'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-gray-500'>Name</p>
                                        <p className='font-medium'>{state.basicInfo.data.name}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500'>Symbol</p>
                                        <p className='font-medium'>${state.basicInfo.data.symbol}</p>
                                    </div>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-gray-500'>Supply</p>
                                        <p className='font-medium'>{state.basicInfo.data.supply}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500'>Decimal</p>
                                        <p className='font-medium'>{state.basicInfo.data.decimals}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm text-gray-500'>Description</p>
                                    <p className='font-medium'>{state.basicInfo.data.description}</p>
                                </div>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <p className='text-sm text-gray-500'>Revoke Mint Authority</p>
                                        <p className='font-medium'>{state.basicInfo.data.revokeMintEnabled ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500'>Revoke Freeze Authority</p>
                                        <p className='font-medium'>{state.basicInfo.data.revokeFreezeEnabled ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                                {state.basicInfo.data.socialLinks && (
                                    <div className='space-y-2'>
                                        <p className='text-sm text-gray-500'>Social Links</p>
                                        <div className='grid grid-cols-2 gap-4'>
                                            {Object.entries(state.basicInfo.data.socialLinks).map(([key, value]) => (
                                                value && (
                                                    <div key={key}>
                                                        <p className='text-sm capitalize'>{key}</p>
                                                        <a href={value} target="_blank" rel="noopener noreferrer" className='text-blue-500 hover:underline'>{value}</a>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Token Allocation */}
                    {state.allocation.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('tokenAllocation')}
                            >
                                <span className='font-semibold'>Token Allocation</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.tokenAllocation ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.tokenAllocation && (
                                <div className='mt-4 space-y-3'>
                                    {state.allocation.data.map((allocation, index) => (
                                        <div key={index} className='flex justify-between items-center py-2 hover:bg-gray-50 rounded-md px-2'>
                                            <div>
                                                <p className='font-medium'>{allocation.description || `Allocation #${index + 1}`}</p>
                                                <p className='text-sm text-gray-500'>{allocation.lockupPeriod} days Lockup</p>
                                            </div>
                                            <span className='font-medium'>{allocation.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vesting Schedule */}
                    {state.vesting.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('vestingSchedule')}
                            >
                                <span className='font-semibold'>Vesting Schedule</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.vestingSchedule ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.vestingSchedule && (
                                <div className='mt-4 space-y-3'>
                                    {state.vesting.data.map((vesting, index) => (
                                        <div key={index} className='border border-gray-200 rounded-lg p-4'>
                                            <div className='flex justify-between items-center mb-2'>
                                                <p className='font-medium'>{vesting.description || `Schedule #${index + 1}`}</p>
                                                <span className='font-medium'>{vesting.percentage}%</span>
                                            </div>
                                            <p className='text-sm text-gray-500'>Lockup Period: {vesting.lockupPeriod} days</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bonding Curve */}
                    {state.bondingCurve.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('bondingCurve')}
                            >
                                <span className='font-semibold'>Bonding Curve</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.bondingCurve ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.bondingCurve && (
                                <div className='mt-4 space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Curve Type</p>
                                            <p className='font-medium'>{state.bondingCurve.data.curveType}</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Initial Price</p>
                                            <p className='font-medium'>{state.bondingCurve.data.initialPrice} SOL</p>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Target Price</p>
                                            <p className='font-medium'>{state.bondingCurve.data.targetPrice} SOL</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Max Supply</p>
                                            <p className='font-medium'>{state.bondingCurve.data.maxSupply}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fees */}
                    {state.fees.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('fees')}
                            >
                                <span className='font-semibold'>Fees</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.fees ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.fees && (
                                <div className='mt-4 space-y-4'>
                                    <div className='grid grid-cols-3 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Mint Fee</p>
                                            <p className='font-medium'>{state.fees.data.mintFee}%</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Transfer Fee</p>
                                            <p className='font-medium'>{state.fees.data.transferFee}%</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Burn Fee</p>
                                            <p className='font-medium'>{state.fees.data.burnFee}%</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className='text-sm text-gray-500'>Admin Controls</p>
                                        <p className='font-medium'>{state.fees.data.adminControls ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Launchpad */}
                    {state.launchpad.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('launchpad')}
                            >
                                <span className='font-semibold'>Launchpad</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.launchpad ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.launchpad && (
                                <div className='mt-4 space-y-4'>
                                    <div>
                                        <p className='text-sm text-gray-500'>Launch Period</p>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div>
                                                <p className='text-sm text-gray-500'>Start Time</p>
                                                <p className='font-medium'>{state.launchpad.data.startTime}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm text-gray-500'>End Time</p>
                                                <p className='font-medium'>{state.launchpad.data.endTime}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Soft Cap</p>
                                            <p className='font-medium'>{state.launchpad.data.softCap} SOL</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Hard Cap</p>
                                            <p className='font-medium'>{state.launchpad.data.hardCap} SOL</p>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Min Contribution</p>
                                            <p className='font-medium'>{state.launchpad.data.minContribution} SOL</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Max Contribution</p>
                                            <p className='font-medium'>{state.launchpad.data.maxContribution} SOL</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Liquidity */}
                    {state.liquidity.enabled && (
                        <div className='py-4'>
                            <button 
                                className='w-full flex justify-between items-center'
                                onClick={() => toggleSection('liquidity')}
                            >
                                <span className='font-semibold'>Liquidity</span>
                                <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openSections.liquidity ? 'rotate-180' : ''}`} />
                            </button>
                            {openSections.liquidity && (
                                <div className='mt-4 space-y-4'>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Selected DEX</p>
                                            <div className='flex items-center gap-2 mt-1'>
                                                <img src={state.liquidity.data.selectedDex.icon} alt={state.liquidity.data.selectedDex.name} className="w-5 h-5 rounded-full" />
                                                <p className='font-medium'>{state.liquidity.data.selectedDex.name}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Liquidity Type</p>
                                            <p className='font-medium capitalize'>{state.liquidity.data.liquidityType}-Sided</p>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Liquidity Source</p>
                                            <p className='font-medium capitalize'>{state.liquidity.data.liquiditySource}</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Liquidity Percentage</p>
                                            <p className='font-medium'>{state.liquidity.data.liquidityPercentage}%</p>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <p className='text-sm text-gray-500'>Lockup Period</p>
                                            <p className='font-medium'>{state.liquidity.data.lockupPeriod} days</p>
                                        </div>
                                        <div>
                                            <p className='text-sm text-gray-500'>Auto Lock</p>
                                            <p className='font-medium'>{state.liquidity.data.autoLock ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                    <div className='space-y-2'>
                                        <p className='text-sm text-gray-500'>Features</p>
                                        <div className='grid grid-cols-2 gap-4'>
                                            <div>
                                                <p className='text-sm'>Auto Listing</p>
                                                <p className='text-sm font-medium'>{state.liquidity.data.autoListing ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm'>Price Protection</p>
                                                <p className='text-sm font-medium'>{state.liquidity.data.priceProtection ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm'>Market Making</p>
                                                <p className='text-sm font-medium'>{state.liquidity.data.marketMaking ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                            <div>
                                                <p className='text-sm'>Anti-Bot Protection</p>
                                                <p className='text-sm font-medium'>{state.liquidity.data.antiBotProtection ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className='bg-gray-50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-500'>Estimated Deployment Cost</p>
                    <div className='flex items-center gap-2 mt-1'>
                        <p className='font-medium'>0.005 SOL</p>
                        <span className='text-gray-500'>≈ $0.75 USD</span>
                    </div>
                </div>
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
                >
                    Deploy Token
                </button>
            </div>
        </div>
    )
}

export default ReviewAndDeploy;