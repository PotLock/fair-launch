import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheck } from 'lucide-react';
import { useDeployStore } from '../../../stores/deployStores';
import { SliderCustom } from '../../ui/slider-custom';
import { Input } from '../../ui/input';
import type { Fees } from '../../../types';

export const FeesStep = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { fees, updateFees, validationErrors, validateFees } = useDeployStore();

    const handleFeeChange = (field: keyof Fees, value: any) => {
        if (field === 'adminControls') {
            updateFees({ adminControls: value });
        } else {
            updateFees({ [field]: value });
        }
        validateFees();
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Fee Configuration</div>
                    {Object.keys(validationErrors).length === 0 && fees.mintFee && fees.transferFee && fees.burnFee && fees.feeRecipientAddress && (!fees.adminControls.isEnabled || (fees.adminControls.isEnabled && fees.adminControls.walletAddress)) ? (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                    ) : isExpanded ? (
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
                                        <h1 className='text-sm font-medium'>Mint Fee ({fees.mintFee}%)</h1>
                                        <SliderCustom
                                            value={[Number(fees.mintFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('mintFee', value[0].toString())}
                                            step={0.5}
                                            min={0}
                                            max={100}
                                        />
                                        <p className='text-xs text-gray-500'>The fee charged when a user mints new tokens.</p>
                                        {validationErrors.mintFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.mintFee}</p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Transfer Fee ({fees.transferFee}%)</h1>
                                        <SliderCustom
                                            value={[Number(fees.transferFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('transferFee', value[0].toString())}
                                            step={0.5}
                                            min={0}
                                            max={100}
                                        />
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are transferred between wallets</p>
                                        {validationErrors.transferFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.transferFee}</p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Burn Fee ({fees.burnFee}%)</h1>
                                        <SliderCustom
                                            value={[Number(fees.burnFee) || 0]}
                                            onValueChange={(value) => handleFeeChange('burnFee', value[0].toString())}
                                            step={0.5}
                                            min={0}
                                            max={100}
                                        />
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are burned.</p>
                                        {validationErrors.burnFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.burnFee}</p>
                                        )}
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
                                            className={`text-xs ${validationErrors.feeRecipientAddress ? 'border-red-500' : ''}`}
                                            value={fees.feeRecipientAddress}
                                            onChange={(e) => handleFeeChange('feeRecipientAddress', e.target.value)}
                                        />
                                        {validationErrors.feeRecipientAddress && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.feeRecipientAddress}</p>
                                        )}
                                    </div>
                                </div>
                                <div className='space-y-4 border border-gray-200 rounded-lg p-3'>
                                    <div className='flex flex-row justify-between items-center'>
                                        <div className='flex flex-col gap-1'>
                                            <h1 className='text-sm font-medium'>Admin Controls</h1>
                                            <span className='text-xs text-gray-500'>Allow changing fees after deployment</span>
                                        </div>
                                        <button
                                            onClick={() => handleFeeChange('adminControls', { ...fees.adminControls, isEnabled: !fees.adminControls.isEnabled })}
                                            className={`
                                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                                ${fees.adminControls.isEnabled ? 'bg-black' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                                    ${fees.adminControls.isEnabled ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Admin Address</h1>
                                        <Input
                                            type="text"
                                            placeholder='Wallet address to receive fees'
                                            className={`text-xs ${validationErrors.adminWalletAddress ? 'border-red-500' : ''}`}
                                            value={fees.adminControls.walletAddress}
                                            disabled={!fees.adminControls.isEnabled}
                                            onChange={(e) => handleFeeChange('adminControls', { ...fees.adminControls, walletAddress: e.target.value })}
                                        />
                                        {validationErrors.adminWalletAddress && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.adminWalletAddress}</p>
                                        )}
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
