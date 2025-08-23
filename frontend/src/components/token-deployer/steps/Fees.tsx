import { ChevronDown, ChevronUp, CircleCheck, LucideMessageCircleQuestion } from 'lucide-react';
import { useDeployStore } from '../../../stores/deployStore';
import { SliderCustom } from '../../ui/slider-custom';
import { Input } from '../../ui/input';
import type { Fees } from '../../../types';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import type { StepProps } from '../../../types';

export const FeesStep = ({ isExpanded, stepKey, onHeaderClick }: StepProps) => {
    const { fees, updateFees, validationErrors, validateFees } = useDeployStore();
    const { publicKey } = useWallet();
    const prevPublicKey = useRef<string | null>(null);

    useEffect(() => {
        const pubkeyStr = publicKey?.toString() || '';
        if (
            pubkeyStr &&
            (fees.feeRecipientAddress === '' || fees.feeRecipientAddress === prevPublicKey.current)
        ) {
            updateFees({ feeRecipientAddress: pubkeyStr });
        }
        prevPublicKey.current = pubkeyStr;
    }, [publicKey]);

    const handleFeeChange = (field: keyof Fees, value: any) => {
        if (field === 'adminControls') {
            updateFees({ adminControls: value });
        } else {
            updateFees({ [field]: value });
        }
        validateFees();
    };

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const handleFeeSliderChange = (field: keyof Fees, value: number) => {
        let mint = Number(fees.mintFee) || 0;
        let transfer = Number(fees.transferFee) || 0;
        let burn = Number(fees.burnFee) || 0;
        let newMint = mint, newTransfer = transfer, newBurn = burn;

        if (field === 'mintFee') {
            newMint = clamp(value, 0, 100 - transfer - burn);
            if (newMint + transfer + burn > 100) {
                const over = newMint + transfer + burn - 100;
                if (burn >= over) {
                    newBurn = burn - over;
                } else if (transfer >= over - burn) {
                    newBurn = 0;
                    newTransfer = transfer - (over - burn);
                } else {
                    newBurn = 0;
                    newTransfer = 0;
                }
            }
        } else if (field === 'transferFee') {
            newTransfer = clamp(value, 0, 100 - mint - burn);
            if (mint + newTransfer + burn > 100) {
                const over = mint + newTransfer + burn - 100;
                if (burn >= over) {
                    newBurn = burn - over;
                } else if (mint >= over - burn) {
                    newBurn = 0;
                    newMint = mint - (over - burn);
                } else {
                    newBurn = 0;
                    newMint = 0;
                }
            }
        } else if (field === 'burnFee') {
            newBurn = clamp(value, 0, 100 - mint - transfer);
            if (mint + transfer + newBurn > 100) {
                const over = mint + transfer + newBurn - 100;
                if (transfer >= over) {
                    newTransfer = transfer - over;
                } else if (mint >= over - transfer) {
                    newTransfer = 0;
                    newMint = mint - (over - transfer);
                } else {
                    newTransfer = 0;
                    newMint = 0;
                }
            }
        }
        updateFees({ mintFee: newMint, transferFee: newTransfer, burnFee: newBurn });
        validateFees();
    };

    const isFormValid = () => {
        const hasErrors = Object.keys(validationErrors).some(key => 
            key.includes('mintFee') || 
            key.includes('transferFee') || 
            key.includes('burnFee') || 
            key.includes('feeRecipientAddress') ||
            key.includes('adminWalletAddress') ||
            key.includes('totalFee')
        );
        
        const hasRequiredFields = (fees.mintFee !== undefined && fees.mintFee !== null)
                                 && (fees.transferFee !== undefined && fees.transferFee !== null)
                                 && (fees.burnFee !== undefined && fees.burnFee !== null)
                                 && fees.feeRecipientAddress && fees.feeRecipientAddress.trim() !== '';
        
        const totalFee = Number(fees.mintFee) + Number(fees.transferFee) + Number(fees.burnFee);
        const isTotalFeeValid = !isNaN(totalFee) && totalFee <= 100;
        
        const hasValidAdminControls = !fees.adminControls.isEnabled || 
                                     (fees.adminControls.isEnabled && fees.adminControls.walletAddress && fees.adminControls.walletAddress.trim() !== '');
        
        return !hasErrors && hasRequiredFields && hasValidAdminControls && isTotalFeeValid;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => onHeaderClick(stepKey)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Fee Configuration</div>
                    {isFormValid() ? (
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
                                        <div className='flex flex-row gap-2 items-center'>
                                            <h1 className='text-sm font-medium'>Mint Fee ({fees.mintFee}%)</h1>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <img src="/icons/circle-question-mark.svg" alt="circle-question-mark" className='h-4 w-4 cursor-help' />
                                                </TooltipTrigger>
                                                <TooltipContent className='border border-gray-200'>
                                                    <p className='md:max-w-[300px] text-wrap'>Fee charged when new tokens are minted. This fee is typically collected by the platform as a service fee.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <SliderCustom
                                            value={[Number(fees.mintFee) || 0]}
                                            min={0}
                                            max={100 - Number(fees.transferFee) - Number(fees.burnFee)}
                                            onValueChange={(value) => handleFeeSliderChange('mintFee', value[0])}
                                            step={0.5}
                                        />
                                        <p className='text-xs text-gray-500'>The fee charged when a user mints new tokens.</p>
                                        {validationErrors.mintFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.mintFee}</p>
                                        )}
                                        {Number(fees.mintFee) > 50 && (
                                            <p className="text-xs text-yellow-500 mt-1 font-semibold">Mint fee is very high (&gt; 50%)</p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <div className='flex flex-row gap-2 items-center'>
                                            <h1 className='text-sm font-medium'>Transfer Fee ({fees.transferFee}%)</h1>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <img src="/icons/circle-question-mark.svg" alt="circle-question-mark" className='h-4 w-4 cursor-help' />
                                                </TooltipTrigger>
                                                <TooltipContent className='border border-gray-200'>
                                                    <p className='md:max-w-[300px] text-wrap'>Fee charged when tokens are transferred between wallets. This is the most common fee type and generates ongoing revenue.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <SliderCustom
                                            value={[Number(fees.transferFee) || 0]}
                                            min={0}
                                            max={100 - Number(fees.mintFee) - Number(fees.burnFee)}
                                            onValueChange={(value) => handleFeeSliderChange('transferFee', value[0])}
                                            step={0.5}
                                        />
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are transferred between wallets</p>
                                        {validationErrors.transferFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.transferFee}</p>
                                        )}
                                        {Number(fees.transferFee) > 50 && (
                                            <p className="text-xs text-yellow-500 mt-1 font-semibold">Transfer fee is very high (&gt; 50%)</p>
                                        )}
                                    </div>
                                    <div className='space-y-2'>
                                        <div className='flex flex-row gap-2 items-center'>
                                            <h1 className='text-sm font-medium'>Burn Fee ({fees.burnFee}%)</h1>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <img src="/icons/circle-question-mark.svg" alt="circle-question-mark" className='h-4 w-4 cursor-help' />
                                                </TooltipTrigger>
                                                <TooltipContent className='border border-gray-200'>
                                                    <p className='md:max-w-[300px] text-wrap'>Fee charged when tokens are burned. This fee is collected before the tokens are removed from circulation.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <SliderCustom
                                            value={[Number(fees.burnFee) || 0]}
                                            min={0}
                                            max={100 - Number(fees.mintFee) - Number(fees.transferFee)}
                                            onValueChange={(value) => handleFeeSliderChange('burnFee', value[0])}
                                            step={0.5}
                                        />
                                        <p className='text-xs text-gray-500'>Fee charged when tokens are burned.</p>
                                        {validationErrors.burnFee && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.burnFee}</p>
                                        )}
                                        {Number(fees.burnFee) > 50 && (
                                            <p className="text-xs text-yellow-500 mt-1 font-semibold">Burn fee is very high (&gt; 50%)</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className='space-y-4 flex flex-col gap-0.5'>
                                <div className='space-y-4 border border-gray-200 rounded-lg p-3'>
                                    <div className='flex flex-col gap-1'>
                                        <div className='flex flex-row gap-2 items-center'>
                                            <h1 className='text-sm font-medium'>Fee Recipient</h1>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <img src="/icons/circle-question-mark.svg" alt="circle-question-mark" className='h-4 w-4 cursor-help' />
                                                </TooltipTrigger>
                                                <TooltipContent className='border border-gray-200'>
                                                    <p className='md:max-w-[300px] text-wrap'>The wallet address that will receive the collected fees. Make sure this is a wallet you control.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <span className='text-xs text-gray-500'>Who receives the collected fees</span>
                                    </div>
                                    <div className='space-y-2'>
                                        <h1 className='text-sm font-medium'>Fee Recipient Address <span className='text-red-500'>*</span></h1>
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
                                            <div className='flex flex-row gap-2 items-center'>
                                                <h1 className='text-sm font-medium'>Admin Controls</h1>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <img src="/icons/circle-question-mark.svg" alt="circle-question-mark" className='h-4 w-4 cursor-help' />
                                                    </TooltipTrigger>
                                                    <TooltipContent className='border border-gray-200'>
                                                        <p className='md:max-w-[300px] text-wrap'>Allow changing fee settings after deployment.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
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
                                        <h1 className='text-sm font-medium'>Admin Address <span className='text-red-500'>*</span></h1>
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
