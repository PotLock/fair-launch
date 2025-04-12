import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { Terminal } from 'lucide-react';
import { useTokenDeployer,FeesErrors } from '../../../context/TokenDeployerContext';

interface FeesProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const Fees = ({ setCurrentStep, currentStep }: FeesProps) => {
    const { state, updateFees, setStepEnabled, validateFees } = useTokenDeployer();

    const handleFeeChange = (field: keyof typeof state.fees.data, value: string | boolean) => {
        updateFees({ [field]: value });
        setTimeout(validateFees, 0);
    };

    const handleNext = () => {
        if (validateFees()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const getErrorClass = (field: keyof FeesErrors) => {
        return state.fees.errors?.[field] ? 'border-red-500' : 'border-gray-200';
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Fee Configuration</h1>
                    <p className="text-xs text-gray-500">Configure fees for various token operations. Fees can be used to fund development, marketing or other activities.</p> 
                </div>
                <button
                    onClick={() => setStepEnabled('fees', !state.fees.enabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${state.fees.enabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${state.fees.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>
            
            {
                state.fees.enabled && (
                    <div className='space-y-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-center'>
                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>Mint Fee (1.5%)</h1>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={state.fees.data.mintFee || ''}
                                    onChange={(e) => handleFeeChange('mintFee', e.target.value)}
                                    className={`w-full h-2 bg-gray-200 rounded-full cursor-pointer accent-black`}
                                />
                                {state.fees.errors?.mintFee && (
                                    <p className="text-xs text-red-500">{state.fees.errors.mintFee}</p>
                                )}
                                <p className='text-xs text-gray-500'>The fee charged when a user mints new tokens.</p>
                            </div>
                            <div className='space-y-2 flex flex-col'>
                                <h1 className='text-base font-semibold'>Admin Controls</h1>
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
                                <span className='text-xs text-gray-500'>Enable admin to change fee recipient address after deployment</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-center'>
                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>Transfer Fee (0.5%)</h1>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={state.fees.data.transferFee || ''}
                                    onChange={(e) => handleFeeChange('transferFee', e.target.value)}
                                    className={`w-full h-2 bg-gray-200 rounded-full cursor-pointer accent-black`}
                                />
                                {state.fees.errors?.transferFee && (
                                    <p className="text-xs text-red-500">{state.fees.errors.transferFee}</p>
                                )}
                                <p className='text-xs text-gray-500'>Fee charged when tokens are transferred between wallets</p>
                            </div>
                            <div className='space-y-2 flex flex-col'>
                                <h1 className='text-base font-semibold'>Fee Recipient Address <strong className='text-red-500'>*</strong></h1>
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-md p-2 ${getErrorClass('feeRecipientAddress')}`}
                                    placeholder='wallet address to receive fees'
                                    value={state.fees.data.feeRecipientAddress}
                                    onChange={(e) => handleFeeChange('feeRecipientAddress', e.target.value)}
                                />
                                {state.fees.errors?.feeRecipientAddress && (
                                    <p className="text-xs text-red-500">{state.fees.errors.feeRecipientAddress}</p>
                                )}
                                <span className='text-xs text-gray-500'>The wallet address that will receive the collected fees</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-10 items-center'>
                            <div className='space-y-2'>
                                <h1 className='text-base font-semibold'>Burn Fee (0%)</h1>
                                <input 
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={state.fees.data.burnFee || ''}
                                    onChange={(e) => handleFeeChange('burnFee', e.target.value)}
                                    className={`w-full h-2 bg-gray-200 rounded-full cursor-pointer accent-black`}
                                />
                                {state.fees.errors?.burnFee && (
                                    <p className="text-xs text-red-500">{state.fees.errors.burnFee}</p>
                                )}
                                <p className='text-xs text-gray-500'>Fee charged when tokens are burned.</p>
                            </div>
                            <div className='space-y-2 flex flex-col'>
                                <h1 className='text-base font-semibold'>Admin Address</h1>
                                <input 
                                    type="text" 
                                    className={`w-full border rounded-md p-2 ${getErrorClass('adminAddress')}`}
                                    placeholder='wallet address'
                                    value={state.fees.data.adminAddress}
                                    onChange={(e) => handleFeeChange('adminAddress', e.target.value)}
                                    disabled={!state.fees.data.adminControls}
                                />
                                {state.fees.errors?.adminAddress && (
                                    <p className="text-xs text-red-500">{state.fees.errors.adminAddress}</p>
                                )}
                                <span className='text-xs text-gray-500'>This address will have permission to change the fee recipient in the future. If left empty, the deployer account will be the default admin.</span>
                            </div>
                        </div>
                        <div className='flex flex-row gap-4 items-start p-4 border border-blue-200 rounded-lg bg-blue-50'>
                            <Terminal className='w-6 h-6' />
                            <div className='flex flex-col gap-2'>
                                <h2 className='text-base font-semibold'>Fee Impact Estimation</h2>
                                <p className='text-sm text-gray-500'>With the current fee configuration, a token holder transferring 1,000 tokens would pay approximately 5 token in fees. If all tokens are minted at once, the mint fee would generate approximately 15000 tokens in fees.</p>
                            </div>
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
                    className={`
                        bg-black text-white py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors 
                        flex flex-row gap-2 items-center justify-center
                        ${state.fees.enabled && !state.fees.isValid ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={handleNext}
                    disabled={state.fees.enabled && !state.fees.isValid}
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Fees;