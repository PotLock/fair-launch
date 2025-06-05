import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { SliderCustom } from '../../ui/slider-custom';
import { Input } from '../../ui/input';

export const Fees = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { state, updateFees } = useTokenDeployer();

    const handleFeeChange = (field: keyof typeof state.fees.data, value: string | boolean) => {
        updateFees({ [field]: value });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Fee Configuration</div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </div>
                {
                    isExpanded && (
                        <p className="text-xs text-gray-500 mb-4">Configure fees for token operations to generate revenue and fund development.</p>
                    )
                }
            </div>
            {
                isExpanded && (
                    <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-start'>
                            <div className='space-y-4 border border-gray-200 rounded-lg p-3'>
                                <div className='flex flex-col gap-1'>
                                    <h1 className='text-sm font-medium'>Admin Controls</h1>
                                    <span className='text-xs text-gray-500'>Enable admin to change fee recipient address after deployment</span>
                                </div>
                                <div className='space-y-6 pt-4'>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Mint Fee (1.5%)</h1>
                                        <SliderCustom
                                            value={[Number(state.fees.data.mintFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('mintFee', value[0].toString())}
                                        />
                                        {state.fees.errors?.mintFee && (
                                            <p className="text-xs text-red-500">{state.fees.errors.mintFee}</p>
                                        )}
                                        <p className='text-xs text-gray-500'>The fee charged when a user mints new tokens.</p>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Transfer Fee (0.5%)</h1>
                                        <SliderCustom
                                            value={[Number(state.fees.data.transferFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('transferFee', value[0].toString())}
                                        />
                                        {state.fees.errors?.transferFee && (
                                            <p className="text-xs text-red-500">{state.fees.errors.transferFee}</p>
                                        )}
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are transferred between wallets</p>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Burn Fee (0%)</h1>
                                        <SliderCustom
                                            value={[Number(state.fees.data.burnFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('burnFee', value[0].toString())}
                                        />
                                        {state.fees.errors?.burnFee && (
                                            <p className="text-xs text-red-500">{state.fees.errors.burnFee}</p>
                                        )}
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are burned.</p>
                                    </div>
                                </div>
                            </div>
                            <div className='space-y-4 flex flex-col gap-0.5'>
                                <div className='space-y-4 border border-gray-200 rounded-lg p-3'>
                                    <div className='flex flex-col gap-1'>
                                        <h1 className='text-sm font-medium'>Fee Recipient</h1>
                                        <span className='text-xs text-gray-500'>Who receives the collected fees</span>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Fee Recipient Address</h1>
                                        <Input
                                            type="text"
                                            placeholder='Wallet address to receive fees'
                                            className='text-xs'
                                            value={state.fees.data.feeRecipientAddress}
                                            onChange={(e) => handleFeeChange('feeRecipientAddress', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className='space-y-4 border border-gray-200 rounded-lg p-3'>
                                    <div className='flex flex-row justify-between items-center'>
                                        <div className='flex flex-col gap-1'>
                                            <h1 className='text-sm font-medium'>Admin Controls</h1>
                                            <span className='text-xs text-gray-500'>Allow changing fees after deployment</span>
                                        </div>
                                        <button
                                            onClick={() => handleFeeChange('adminControls', !state.fees.data.adminControls)}
                                            className={`
                                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                                ${state.fees.data.adminControls ? 'bg-black' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                                    ${state.fees.data.adminControls ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Admin Address</h1>
                                        <Input
                                            type="text"
                                            placeholder='Wallet address to receive fees'
                                            className='text-xs'
                                            value={state.fees.data.feeRecipientAddress}
                                            onChange={(e) => handleFeeChange('feeRecipientAddress', e.target.value)}
                                        />
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <span className='text-xs text-gray-500'>This address can change fee settings after deployment.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};
